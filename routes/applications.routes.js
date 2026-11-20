const express = require("express");
const { getAllApplications, getApplicationById, getStats, createApplication, updateApplication, deleteApplication } = require("../controllers/applications.controllers");


const router = express.Router();
// get all application (supports filters/sort/pagination)
router.get("/", getAllApplications);

// get application count by status
router.get("/stats", getStats);

//get a single application by id
router.get("/:id", getApplicationById);

// create a new application
router.post("/", createApplication);

//partially update an application
router.put("/:id", updateApplication);

// delete an application
router.delete("/:id", deleteApplication);

module.exports = router;

