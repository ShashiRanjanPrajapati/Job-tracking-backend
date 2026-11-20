const Application = require("../models/application.model");

function sendSuccess(res, status, data) {
  res.status(status).json({ success: true, data });
}

function sendError(res, status, message) {
  res.status(status).json({ success: false, error: message });
}

exports.getAllApplications = async (req, res, next) => {
  try {
    const { status, sort, page, limit } = req.query;
    const applications = await Application.findAll({ status, sort, page, limit });
    sendSuccess(res, 200, applications);
  } catch (err) {
    next(err);
  }
};

exports.getApplicationById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const application = await Application.findById(id);

    if (!application) {
      return sendError(res, 404, "Application not found");
    }

    sendSuccess(res, 200, application);
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const stats = await Application.getStats();
    sendSuccess(res, 200, stats);
  } catch (err) {
    next(err);
  }
};

exports.createApplication = async (req, res, next) => {
  try {
    const { company, role, status } = req.body;
    if (!company || !role) {
      return sendError(res, 400, "company and role are required");
    }

    const newApplication = await Application.create({ company, role, status });
    sendSuccess(res, 201, newApplication);
  } catch (err) {
    next(err);
  }
};

exports.updateApplication = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { company, role, status } = req.body;

    const updated = await Application.update(id, { company, role, status });
    if (!updated) {
      return sendError(res, 404, "Application not found");
    }

    sendSuccess(res, 200, updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteApplication = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const deleted = await Application.delete(id);
    if (!deleted) {
      return sendError(res, 404, "Application not found");
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
