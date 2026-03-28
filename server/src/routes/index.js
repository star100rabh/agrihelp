const express = require("express");
const {
  listFarmers,
  getDashboard,
  getEligibleSchemes,
  getTracking,
  getVoiceQueue,
  createCallLog,
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "kisansahayak-api" });
});

router.get("/farmers", listFarmers);
router.get("/dashboard/:farmerId", getDashboard);
router.get("/farmers/:farmerId/schemes", getEligibleSchemes);
router.get("/farmers/:farmerId/tracking", getTracking);
router.get("/voice/queue", getVoiceQueue);
router.post("/voice/calls", createCallLog);

module.exports = router;
