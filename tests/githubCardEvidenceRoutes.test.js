const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const mongoose = require('mongoose');
jest.mock('../src/models/KnowledgeDraft',()=>({findOne:jest.fn(),findOneAndUpdate:jest.fn()}));
jest.mock('../src/models/User',()=>({findById:jest.fn()}));
const KnowledgeDraft=require('../src/models/KnowledgeDraft');
const routes=require('../src/routes/knowledgeEvidenceRoutes');
const alice=new mongoose.Types.ObjectId().toString();
const bob=new mongoose.Types.ObjectId().toString();
const cardId=new mongoose.Types.ObjectId().toString();
const url='https://github.com/MyZubster-Ecosystem/myzubster/pull/1424';
const app=express();app.use(express.json());app.use('/api/knowledge-evidence',routes);
const auth=id=>'Bearer '+jwt.sign({userId:id,role:'user'},process.env.JWT_SECRET);
const endpoint='/api/knowledge-evidence/drafts/'+cardId+'/github-evidence';
describe('owner-approved GitHub evidence',()=>{
 beforeEach(()=>{
  process.env.JWT_SECRET='github-evidence-test-secret';
  jest.clearAllMocks();
  global.fetch=jest.fn();
 });
 afterAll(()=>{delete global.fetch});
 test('requires a signed-in owner and explicit confirmation',async()=>{
  await request(app).post(endpoint).send({url,confirm:true}).expect(401);
  await request(app).post(endpoint).set('Authorization',auth(alice)).send({url}).expect(400);
  expect(KnowledgeDraft.findOne).not.toHaveBeenCalled();
 });
 test('rejects non-GitHub, invalid and non-public URL values',async()=>{
  for(const candidate of ['https://evil.example/pull/1','https://github.com/owner/repo/issues/3','https://github.com/owner/repo/pull/1?override=1','http://github.com/owner/repo/pull/3']){
   await request(app).post(endpoint).set('Authorization',auth(alice)).send({url:candidate,confirm:true}).expect(400);
  }
  expect(global.fetch).not.toHaveBeenCalled();
 });
 test('does not fetch or mutate another owner\'s cards',async()=>{
  KnowledgeDraft.findOne.mockReturnValue({lean:async()=>null});
  await request(app).post(endpoint).set('Authorization',auth(bob)).send({url,confirm:true}).expect(404);
  expect(KnowledgeDraft.findOne).toHaveBeenCalledWith({_id:cardId,ownerId:bob});
  expect(global.fetch).not.toHaveBeenCalled();
 });
 test('checks public GitHub API and appends source without elevating to certification',async()=>{
  KnowledgeDraft.findOne.mockReturnValue({lean:async()=>({evidence:[]})});
  global.fetch.mockResolvedValue({ok:true,json:async()=>({number:1424,title:'Documented integration',user:{login:'documenter'}})});
  KnowledgeDraft.findOneAndUpdate.mockResolvedValue({_id:cardId,evidence:[{url}]});
  const response=await request(app).post(endpoint).set('Authorization',auth(alice)).send({url,confirm:true}).expect(200);
  expect(global.fetch.mock.calls[0][0]).toBe('https://api.github.com/repos/MyZubster-Ecosystem/myzubster/pulls/1424');
  expect(response.body.check).toBe('PUBLIC_SOURCE_ACCESSIBLE_NOT_SKILL_VERIFIED');
  expect(KnowledgeDraft.findOneAndUpdate.mock.calls[0][0]).toEqual(expect.objectContaining({ownerId:alice,'evidence.url':{$ne:url},'evidence.11':{$exists:false}}));
  expect(KnowledgeDraft.findOneAndUpdate.mock.calls[0][1].$push.evidence.note).toContain('Non certifica automaticamente');
 });
 test('does not duplicate an existing public evidence URL',async()=>{
  KnowledgeDraft.findOne.mockReturnValue({lean:async()=>({evidence:[{url}]})});
  const response=await request(app).post(endpoint).set('Authorization',auth(alice)).send({url,confirm:true}).expect(200);
  expect(response.body.duplicate).toBe(true);
  expect(global.fetch).not.toHaveBeenCalled();
  expect(KnowledgeDraft.findOneAndUpdate).not.toHaveBeenCalled();
 });
 test('does not attach inaccessible GitHub resources',async()=>{
  KnowledgeDraft.findOne.mockReturnValue({lean:async()=>({evidence:[]})});
  global.fetch.mockResolvedValue({ok:false,status:404});
  await request(app).post(endpoint).set('Authorization',auth(alice)).send({url,confirm:true}).expect(422);
  expect(KnowledgeDraft.findOneAndUpdate).not.toHaveBeenCalled();
 });
});
