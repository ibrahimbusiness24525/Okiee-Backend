const express = require("express");
const router = express.Router();
const {
  createRepairJob,
  toggleRepairJobStatus,
  getAllRepairJobs,
  getRepairJobById,
} = require("../controllers/repairJobController");
const { decoderMiddleware } = require("../services/authServices");

// Create a new repair job
router.post("/repair-job", decoderMiddleware, createRepairJob);

// Toggle repair job status (todo -> in-progress -> complete -> handover)
router.patch("/repair-job/:id/toggle-status", decoderMiddleware, toggleRepairJobStatus);

// Get all repair jobs (optional query: ?status=todo|in-progress|complete|handover)
router.get("/repair-jobs", decoderMiddleware, getAllRepairJobs);

// Get repair job by ID
router.get("/repair-job/:id", decoderMiddleware, getRepairJobById);

module.exports = router;

