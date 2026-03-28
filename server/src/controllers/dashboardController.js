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
};
