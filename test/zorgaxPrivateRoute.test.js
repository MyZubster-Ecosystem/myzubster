jest.mock('../src/middleware/auth', () => ({
  optionalAuthenticate: (req, _res, next) => { req.userId = 'test-owner'; next(); },
  authenticate: (_req, _res, next) => next()
}));
jest.mock('../src/middleware/zorgaxAccess', () => ({
  createZorgaxAccessMiddleware: () => ({
    loadZorgaxAccess: (req, _res, next) => {
      req.zorgaxPolicy = { webResearch:true, maxWebResults:2 };
      req.zorgaxAccess = { plan:'free' }; next();
    },
    requireZorgaxPlan: () => (_req, _res, next) => next()
  }),
  publicAccess: value => value
}));
jest.mock('../src/services/zorgaxAssistantService', () => ({answer:jest.fn(async () => ({response:'ok',sources:[]}))}));
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { answer } = require('../src/services/zorgaxAssistantService');
const app = express();
const originalReadyState = mongoose.connection._readyState;
app.use(express.json());
app.use(require('../src/routes/zorgaxAssistantRoutes'));

beforeEach(() => {
  jest.clearAllMocks();
  mongoose.connection._readyState = 1;
  jest.spyOn(User, 'findById').mockReturnValue({select:() => ({lean:async () => ({username:'private-user',github:{id:'42',login:'verified-user'}})})});
});
afterEach(() => { mongoose.connection._readyState = originalReadyState; jest.restoreAllMocks(); });

test('private chat enriches verified identity locally and suppresses requested web', async () => {
  const result = await request(app).post('/chat').send({message:'ciao',useWeb:true});
  expect(result.status).toBe(200);
  expect(answer.mock.calls[0][0]).toMatchObject({privacyMode:'private',useWeb:false});
  expect(answer.mock.calls[0][0].userContext).toContain('verified-user');
});

test('external chat never automatically exports account context', async () => {
  const result = await request(app).post('/chat').send({message:'ciao',privacyMode:'external',externalConsent:true});
  expect(result.status).toBe(200);
  expect(User.findById).not.toHaveBeenCalled();
  expect(answer.mock.calls[0][0]).toMatchObject({privacyMode:'external',externalConsent:true,userContext:''});
});

test('missing external consent fails before identity lookup or inference', async () => {
  const result = await request(app).post('/chat').send({message:'ciao',privacyMode:'external'});
  expect(result.status).toBe(400);
  expect(User.findById).not.toHaveBeenCalled();
  expect(answer).not.toHaveBeenCalled();
});
