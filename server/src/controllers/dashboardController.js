const Farmer = require("../models/Farmer");
const Scheme = require("../models/Scheme");
const Application = require("../models/Application");
const CallLog = require("../models/CallLog");
const {
  demoFarmers,
  demoSchemes,
  demoApplications,
  demoCallLogs,
} = require("../data/demoData");
const {
  getEligibleSchemesForFarmer,
  scoreSchemesByPriority,
  getPhoneUserCategory,
} = require("../services/eligibilityService");

const FOLLOW_UP_DAYS = 5;

function formatTimeline(application) {
  if (application.timeline?.length) return application.timeline;

  return [
    {
      step: "Applied",
      status: application.status === "draft" ? "pending" : "completed",
      dateLabel: application.submittedAt
        ? new Date(application.submittedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })
        : "TBD",
    },
    {
      step: "Verification",
      status: ["verification", "approved", "disbursed"].includes(application.status)
        ? "completed"
        : "pending",
      dateLabel: "TBD",
    },
    {
      step: "Approval",
      status: ["approved", "disbursed"].includes(application.status) ? "completed" : "pending",
      dateLabel: "TBD",
    },
    {
      step: "Disbursement",
      status: application.status === "disbursed" ? "completed" : "pending",
      dateLabel: "TBD",
    },
  ];
}

function mapDemoApplication(application) {
  const scheme = demoSchemes.find((item) => item._id === application.scheme);
  return {
    ...application,
    scheme: scheme
      ? {
          _id: scheme._id,
          title: scheme.title,
          category: scheme.category,
        }
      : null,
    timeline: formatTimeline(application),
  };
}

function mapDbApplication(application) {
  return {
    ...application,
    timeline: formatTimeline(application),
  };
}

function getSchemeSummaryForOutreach(scheme) {
  return {
    _id: scheme._id,
    title: scheme.title,
    benefit: scheme.benefit,
    deadline: scheme.deadline,
    requiredDocuments: scheme.requiredDocuments || [],
    applyUrl: scheme.applyLinks?.[0]?.url || "",
  };
}

function computeCallStatus(callLogs) {
  const sorted = [...callLogs].sort((a, b) => new Date(b.callAt) - new Date(a.callAt));
  const lastCall = sorted[0] || null;
  const lastOutbound = sorted.find((item) => item.callType === "outbound") || null;
  const lastFollowUp = sorted.find((item) => item.callType === "follow_up") || null;

  let followUpAt = null;
  if (lastOutbound?.callAt) {
    const date = new Date(lastOutbound.callAt);
    date.setDate(date.getDate() + FOLLOW_UP_DAYS);
    followUpAt = date.toISOString();
  }

  const requiresFollowUp = Boolean(
    lastOutbound &&
      (!lastFollowUp || new Date(lastFollowUp.callAt) < new Date(lastOutbound.callAt))
  );

  return {
    hasBeenCalled: Boolean(lastOutbound),
    lastCallType: lastCall?.callType || null,
    lastCallAt: lastCall?.callAt || null,
    requiresFollowUp,
    followUpAt,
  };
}

function buildWhatsAppMessage(farmer, schemes) {
  const intro = `Namaste ${farmer.name} ji, based on your profile these schemes are suitable for you:`;
  const lines = schemes.slice(0, 3).map((scheme, index) => {
    const link = scheme.applyLinks?.[0]?.url ? ` Apply: ${scheme.applyLinks[0].url}` : "";
    const deadline = scheme.deadline ? ` Deadline: ${scheme.deadline}.` : "";
    return `${index + 1}. ${scheme.title} - ${scheme.benefit}.${deadline}${link}`;
  });
  const footer =
    "For help, visit nearest CSC center. Reply after applying so we can track your application.";
  return [intro, ...lines, footer].join("\n");
}

async function getFarmerAndSchemesById(farmerId) {
  let farmer = await Farmer.findById(farmerId).lean();
  let schemes = [];
  let callLogs = [];
  let isDemo = false;

  if (farmer) {
    schemes = await Scheme.find({ isActive: true }).lean();
    callLogs = await CallLog.find({ farmer: farmerId }).sort({ callAt: -1 }).lean();
  } else {
    farmer = demoFarmers.find((item) => item._id === farmerId);
    if (!farmer) return null;
    schemes = demoSchemes.filter((item) => item.isActive);
    callLogs = demoCallLogs
      .filter((item) => item.farmer === farmerId)
      .sort((a, b) => new Date(b.callAt) - new Date(a.callAt));
    isDemo = true;
  }

  const eligibleSchemes = scoreSchemesByPriority(
    farmer,
    getEligibleSchemesForFarmer(farmer, schemes)
  );

  return {
    farmer,
    isDemo,
    eligibleSchemes,
    callLogs,
  };
}

async function listFarmers(_req, res, next) {
  try {
    const farmers = await Farmer.find({}, "name phoneType smartphoneProficiency").lean();
    if (farmers.length) {
      return res.json({ farmers });
    }
    return res.json({
      farmers: demoFarmers.map((item) => ({
        _id: item._id,
        name: item.name,
        phoneType: item.phoneType,
        smartphoneProficiency: item.smartphoneProficiency,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

async function getDashboard(req, res, next) {
  try {
    const { farmerId } = req.params;
    let farmer = await Farmer.findById(farmerId).lean();
    let schemes = [];
    let applications = [];
    let callLogs = [];

    if (farmer) {
      schemes = await Scheme.find({ isActive: true }).lean();
      applications = await Application.find({ farmer: farmerId })
        .populate("scheme", "title category")
        .sort({ createdAt: -1 })
        .lean();
      callLogs = await CallLog.find({ farmer: farmerId }).sort({ createdAt: -1 }).lean();
    } else {
      farmer = demoFarmers.find((item) => item._id === farmerId);
      if (!farmer) return res.status(404).json({ message: "Farmer not found" });

      schemes = demoSchemes.filter((item) => item.isActive);
      applications = demoApplications
        .filter((item) => item.farmer === farmerId)
        .map(mapDemoApplication);
      callLogs = demoCallLogs.filter((item) => item.farmer === farmerId);
    }

    const prioritizedSchemes = scoreSchemesByPriority(
      farmer,
      getEligibleSchemesForFarmer(farmer, schemes),
    );

    return res.json({
      farmer: { ...farmer, phoneUserCategory: getPhoneUserCategory(farmer) },
      stats: {
        eligibleSchemes: prioritizedSchemes.length,
        activeApplications: applications.filter((item) => item.status !== "rejected").length,
      },
      prioritizedSchemes,
      applications: applications.map((item) => (item.scheme?.title ? item : mapDbApplication(item))),
      callLogs,
    });
  } catch (error) {
    return next(error);
  }
}

async function getEligibleSchemes(req, res, next) {
  try {
    const { farmerId } = req.params;
    let farmer = await Farmer.findById(farmerId).lean();
    let schemes = [];

    if (farmer) {
      schemes = await Scheme.find({ isActive: true }).lean();
    } else {
      farmer = demoFarmers.find((item) => item._id === farmerId);
      if (!farmer) return res.status(404).json({ message: "Farmer not found" });
      schemes = demoSchemes.filter((item) => item.isActive);
    }

    const prioritizedSchemes = scoreSchemesByPriority(
      farmer,
      getEligibleSchemesForFarmer(farmer, schemes),
    );

    return res.json({ farmerId, schemes: prioritizedSchemes });
  } catch (error) {
    return next(error);
  }
}

async function getTracking(req, res, next) {
  try {
    const { farmerId } = req.params;
    const farmer = await Farmer.findById(farmerId).lean();
    let applications = [];

    if (farmer) {
      applications = await Application.find({ farmer: farmerId })
        .populate("scheme", "title category")
        .sort({ createdAt: -1 })
        .lean();
    } else {
      const demoFarmer = demoFarmers.find((item) => item._id === farmerId);
      if (!demoFarmer) return res.status(404).json({ message: "Farmer not found" });
      applications = demoApplications
        .filter((item) => item.farmer === farmerId)
        .map(mapDemoApplication);
    }

    return res.json({
      farmerId,
      applications: applications.map((item) => (item.scheme?.title ? item : mapDbApplication(item))),
    });
  } catch (error) {
    return next(error);
  }
}

async function getVoiceQueue(_req, res, next) {
  try {
    let farmers = await Farmer.find({
      $or: [
        { phoneType: "keypad" },
        { smartphoneProficiency: "low" },
        { smartphoneProficiency: "medium" },
      ],
    })
      .sort({ updatedAt: -1 })
      .lean();

    let activeSchemes = await Scheme.find({ isActive: true }).lean();

    if (!farmers.length || !activeSchemes.length) {
      farmers = demoFarmers.filter(
        (item) =>
          item.phoneType === "keypad" ||
          item.smartphoneProficiency === "low" ||
          item.smartphoneProficiency === "medium",
      );
      activeSchemes = demoSchemes.filter((item) => item.isActive);
    }

    const queue = farmers.map((farmer) => {
      const prioritizedSchemes = scoreSchemesByPriority(
        farmer,
        getEligibleSchemesForFarmer(farmer, activeSchemes),
      ).slice(0, 3);

      return {
        farmer: {
          _id: farmer._id,
          name: farmer.name,
          phoneNo: farmer.phoneNo,
          phoneType: farmer.phoneType,
          smartphoneProficiency: farmer.smartphoneProficiency,
          location: farmer.location,
        },
        callBrief: prioritizedSchemes.map((scheme) => ({
          name: scheme.title,
          benefit: scheme.benefit,
          deadline: scheme.deadline,
          requiredDocuments: scheme.requiredDocuments,
          cscGuidance: scheme.cscGuidance,
          estimatedFormCharge: scheme.estimatedChargeInr || 0,
        })),
      };
    });

    return res.json({ queue });
  } catch (error) {
    return next(error);
  }
}

async function getAdminUsers(_req, res, next) {
  try {
    let farmers = await Farmer.find({}).lean();
    let schemes = await Scheme.find({ isActive: true }).lean();
    let callLogs = await CallLog.find({}).sort({ callAt: -1 }).lean();

    if (!farmers.length || !schemes.length) {
      farmers = demoFarmers;
      schemes = demoSchemes.filter((item) => item.isActive);
      callLogs = demoCallLogs;
    }

    const users = farmers.map((farmer) => {
      const eligible = scoreSchemesByPriority(
        farmer,
        getEligibleSchemesForFarmer(farmer, schemes)
      ).slice(0, 3);
      const userCallLogs = callLogs.filter((log) => String(log.farmer) === String(farmer._id));
      const callStatus = computeCallStatus(userCallLogs);

      return {
        _id: farmer._id,
        name: farmer.name,
        phoneNo: farmer.phoneNo,
        phoneType: farmer.phoneType,
        smartphoneProficiency: farmer.smartphoneProficiency,
        location: farmer.location,
        schemes: eligible.map(getSchemeSummaryForOutreach),
        callStatus,
      };
    });

    const keypadUsers = users.filter(
      (user) =>
        user.phoneType === "keypad" ||
        user.smartphoneProficiency === "low" ||
        user.smartphoneProficiency === "medium"
    );
    const smartphoneUsers = users.filter((user) => user.phoneType === "smartphone");

    return res.json({
      keypadUsers,
      smartphoneUsers,
    });
  } catch (error) {
    return next(error);
  }
}

async function adminTriggerCall(req, res, next) {
  try {
    const { farmerId, type } = req.body;
    if (!farmerId) {
      return res.status(400).json({ message: "farmerId is required" });
    }

    const callType = type === "follow_up" ? "follow_up" : "outbound";
    const farmerData = await getFarmerAndSchemesById(farmerId);
    if (!farmerData) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const { farmer, isDemo, eligibleSchemes } = farmerData;
    const topScheme = eligibleSchemes[0];
    const summary =
      callType === "follow_up"
        ? `Follow-up call: asked whether ${farmer.name} applied for ${topScheme?.title || "recommended scheme"} and requested application number if submitted.`
        : `Outbound AI call: explained ${topScheme?.title || "recommended schemes"}, benefits, required documents, deadline, and nearby CSC support.`;

    const nextAction =
      callType === "follow_up"
        ? "If applied, collect application number and start tracking. If not applied, capture reason and schedule next reminder."
        : `Call back after ${FOLLOW_UP_DAYS} days to ask if application was submitted.`;

    if (isDemo) {
      const log = {
        _id: `demo-admin-call-${Date.now()}`,
        farmer: farmer._id,
        farmerName: farmer.name,
        callType,
        status: "completed",
        summary,
        nextAction,
        applicationNumber: "",
        callAt: new Date().toISOString(),
      };
      demoCallLogs.unshift(log);
      return res.status(201).json({ callLog: log, persisted: false });
    }

    const callLog = await CallLog.create({
      farmer: farmer._id,
      farmerName: farmer.name,
      callType,
      status: "completed",
      summary,
      nextAction,
      applicationNumber: "",
    });

    return res.status(201).json({ callLog, persisted: true });
  } catch (error) {
    return next(error);
  }
}

async function adminSendWhatsapp(req, res, next) {
  try {
    const { farmerId } = req.body;
    if (!farmerId) {
      return res.status(400).json({ message: "farmerId is required" });
    }

    const farmerData = await getFarmerAndSchemesById(farmerId);
    if (!farmerData) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const { farmer, eligibleSchemes } = farmerData;
    const message = buildWhatsAppMessage(farmer, eligibleSchemes);
    const digitsOnly = String(farmer.phoneNo || "").replace(/\D/g, "");
    const waUrl = `https://wa.me/91${digitsOnly}?text=${encodeURIComponent(message)}`;

    return res.json({
      farmerId,
      message,
      waUrl,
    });
  } catch (error) {
    return next(error);
  }
}

async function createCallLog(req, res, next) {
  try {
    const { farmerId, farmerName, type, status, summary, nextAction, applicationNumber } = req.body;

    if (!farmerId || !summary) {
      return res.status(400).json({ message: "farmerId and summary are required" });
    }

    const farmer = await Farmer.findById(farmerId).lean();
    if (!farmer) {
      const demoFarmer = demoFarmers.find((item) => item._id === farmerId);
      if (!demoFarmer) return res.status(404).json({ message: "Farmer not found" });

      return res.status(201).json({
        callLog: {
          _id: `demo-call-${Date.now()}`,
          farmer: farmerId,
          farmerName: farmerName || demoFarmer.name,
          callType: type || "outbound",
          status: status || "completed",
          summary,
          nextAction: nextAction || "",
          applicationNumber: applicationNumber || "",
          callAt: new Date().toISOString(),
        },
        persisted: false,
      });
    }

    const log = await CallLog.create({
      farmer: farmerId,
      farmerName: farmerName || farmer.name,
      callType: type || "outbound",
      status: status || "completed",
      summary,
      nextAction: nextAction || "",
      applicationNumber: applicationNumber || "",
    });

    return res.status(201).json({ callLog: log, persisted: true });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listFarmers,
  getDashboard,
  getEligibleSchemes,
  getTracking,
  getVoiceQueue,
  createCallLog,
  getAdminUsers,
  adminTriggerCall,
  adminSendWhatsapp,
};
