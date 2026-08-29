'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { ZorgaxDigitalProductProject } = require('../models/ZorgaxDigitalProductProject');
const serviceDefault = require('../services/zorgaxDigitalBusinessService');

function errorStatus(error) {
  const message = String(error?.message || '');
  if (message.includes('not found')) return 404;
  if (message.includes('cannot advance')) return 409;
  if (message.includes('needs more evidence')) return 409;
  if (message.includes('blueprint is required')) return 409;
  return 400;
}

function createZorgaxDigitalBusinessRouter({ authenticateMiddleware = authenticate, ProjectModel = ZorgaxDigitalProductProject, service = serviceDefault } = {}) {
  const router = express.Router();

  router.post('/projects', authenticateMiddleware, async (req, res) => {
    try {
      const project = await service.createProject({ ProjectModel, ownerId: String(req.userId), title: req.body?.title, description: req.body?.description, productType: req.body?.productType, targetCustomer: req.body?.targetCustomer, customerProblem: req.body?.customerProblem, valueProposition: req.body?.valueProposition, metadata: req.body?.metadata || {} });
      return res.status(201).json({ success: true, advisoryOnly: true, requiresHumanApproval: true, executionPerformed: false, project });
    } catch (error) { return res.status(errorStatus(error)).json({ success: false, message: error.message }); }
  });

  router.get('/projects', authenticateMiddleware, async (req, res) => {
    try {
      const projects = await service.listProjects({ ProjectModel, ownerId: String(req.userId), limit: req.query.limit });
      return res.status(200).json({ success: true, projects });
    } catch (error) { return res.status(errorStatus(error)).json({ success: false, message: error.message }); }
  });

  router.get('/projects/:projectId', authenticateMiddleware, async (req, res) => {
    try {
      const item = await service.getProject({ ProjectModel, ownerId: String(req.userId), projectId: req.params.projectId });
      return res.status(200).json({ success: true, project: service.publicProject(item) });
    } catch (error) { return res.status(errorStatus(error)).json({ success: false, message: error.message }); }
  });

  router.put('/projects/:projectId/strategy', authenticateMiddleware, async (req, res) => {
    try {
      const project = await service.updateStrategy({ ProjectModel, ownerId: String(req.userId), projectId: req.params.projectId, targetCustomer: req.body?.targetCustomer, customerProblem: req.body?.customerProblem, valueProposition: req.body?.valueProposition, assumptions: req.body?.assumptions, evidence: req.body?.evidence, risks: req.body?.risks, pricing: req.body?.pricing });
      return res.status(200).json({ success: true, advisoryOnly: true, project });
    } catch (error) { return res.status(errorStatus(error)).json({ success: false, message: error.message }); }
  });

  router.post('/projects/:projectId/validate', authenticateMiddleware, async (req, res) => {
    try {
      const result = await service.validateProjectIdea({ ProjectModel, ownerId: String(req.userId), projectId: req.params.projectId });
      return res.status(200).json({ success: true, advisoryOnly: true, requiresHumanApproval: true, executionPerformed: false, predictsProfit: false, project: result.project, report: result.report });
    } catch (error) { return res.status(errorStatus(error)).json({ success: false, message: error.message }); }
  });

  router.post('/projects/:projectId/blueprint', authenticateMiddleware, async (req, res) => {
    try {
      const result = await service.generateProductBlueprint({ ProjectModel, ownerId: String(req.userId), projectId: req.params.projectId });
      return res.status(200).json({ success: true, advisoryOnly: true, requiresHumanApproval: true, executionPerformed: false, publicationPerformed: false, predictsProfit: false, project: result.project, blueprint: result.blueprint });
    } catch (error) { return res.status(errorStatus(error)).json({ success: false, message: error.message }); }
  });

  router.post('/projects/:projectId/launch-offer', authenticateMiddleware, async (req, res) => {
    try {
      const result = await service.generateLaunchOffer({ ProjectModel, ownerId: String(req.userId), projectId: req.params.projectId });
      return res.status(200).json({ success: true, advisoryOnly: true, requiresHumanApproval: true, executionPerformed: false, publicationPerformed: false, externalMessagesSent: false, predictsProfit: false, project: result.project, launchOffer: result.launchOffer });
    } catch (error) { return res.status(errorStatus(error)).json({ success: false, message: error.message }); }
  });

  router.get('/projects/:projectId/advisory-plan', authenticateMiddleware, async (req, res) => {
    try {
      const plan = await service.getAdvisoryPlan({ ProjectModel, ownerId: String(req.userId), projectId: req.params.projectId });
      return res.status(200).json({ success: true, plan });
    } catch (error) { return res.status(errorStatus(error)).json({ success: false, message: error.message }); }
  });

  router.post('/projects/:projectId/advance', authenticateMiddleware, async (req, res) => {
    try {
      const project = await service.advanceProject({ ProjectModel, ownerId: String(req.userId), projectId: req.params.projectId, nextStatus: req.body?.nextStatus });
      return res.status(200).json({ success: true, advisoryOnly: true, requiresHumanApproval: true, executionPerformed: false, project });
    } catch (error) { return res.status(errorStatus(error)).json({ success: false, message: error.message }); }
  });

  return router;
}

const router = createZorgaxDigitalBusinessRouter();
router.createZorgaxDigitalBusinessRouter = createZorgaxDigitalBusinessRouter;
module.exports = router;
