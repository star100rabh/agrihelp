const express = require("express");
const {
  listFarmers,
  getDashboard,
  getEligibleSchemes,
  getTracking,
  getVoiceQueue,
  createCallLog,
  getAdminUsers,
  adminTriggerCall,
  adminSendWhatsapp,
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "kisansahayak-api" });
});

router.get("/farmers", listFarmers);
router.get("/admin/users", getAdminUsers);
router.get("/dashboard/:farmerId", getDashboard);
router.get("/farmers/:farmerId/schemes", getEligibleSchemes);
router.get("/farmers/:farmerId/tracking", getTracking);
router.get("/voice/queue", getVoiceQueue);
router.post("/voice/calls", createCallLog);
router.post("/admin/call", adminTriggerCall);
router.post("/admin/whatsapp", adminSendWhatsapp);

module.exports = router;
