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
 test('updates the obsolete default note when attaching a new GitHub source',async()=>{
  const stale='Attività dichiarate dal titolare; eventuali commit e PR devono essere aggiunti e controllati prima di considerarli evidenze del lavoro.';
  KnowledgeDraft.findOne.mockReturnValue({lean:async()=>({evidence:[],verificationNote:stale})});
  global.fetch.mockResolvedValue({ok:true,json:async()=>({number:1424,title:'Contributor PR',user:{login:'contributor'}})});
  KnowledgeDraft.findOneAndUpdate.mockResolvedValue({_id:cardId,evidence:[{url}]});
  await request(app).post(endpoint).set('Authorization',auth(alice)).send({url,confirm:true}).expect(200);
  const note=KnowledgeDraft.findOneAndUpdate.mock.calls[0][1].$set.verificationNote;
  expect(note).toContain('Almeno una fonte GitHub pubblica');
  expect(note).not.toContain('devono essere aggiunti');
  expect(note).toContain('non sono verificati indipendentemente');
 });
 test('refreshes an already published owned card with a stale note',async()=>{
  const stale='Attività dichiarate dal titolare; eventuali commit e PR devono essere aggiunti e controllati prima di considerarli evidenze del lavoro.';
  KnowledgeDraft.findOne.mockReturnValue({lean:async()=>({status:'published',evidence:[{url}],verificationNote:stale})});
  KnowledgeDraft.findOneAndUpdate.mockResolvedValue({_id:cardId,status:'published',verificationNote:'updated'});
  await request(app).post('/api/knowledge-evidence/drafts/'+cardId+'/refresh-github-note').set('Authorization',auth(alice)).send({confirm:true}).expect(200);
  expect(KnowledgeDraft.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id:cardId,ownerId:alice,verificationNote:stale });
  expect(KnowledgeDraft.findOneAndUpdate.mock.calls[0][1].$set.verificationNote).toContain('Almeno una fonte GitHub pubblica');
 });
 test('preserves custom verification comments and requires a linked source',async()=>{
  const route='/api/knowledge-evidence/drafts/'+cardId+'/refresh-github-note';
  await request(app).post(route).set('Authorization',auth(alice)).send({}).expect(400);
  KnowledgeDraft.findOne.mockReturnValue({lean:async()=>({evidence:[],verificationNote:'Revisione manuale in corso'})});
  await request(app).post(route).set('Authorization',auth(alice)).send({confirm:true}).expect(409);
  KnowledgeDraft.findOne.mockReturnValue({lean:async()=>({evidence:[{url}],verificationNote:'Revisione manuale in corso'})});
  KnowledgeDraft.findOneAndUpdate.mockResolvedValue({_id:cardId});
  await request(app).post(route).set('Authorization',auth(alice)).send({confirm:true}).expect(200);
  const note=KnowledgeDraft.findOneAndUpdate.mock.calls[0][1].$set.verificationNote;
  expect(note).toContain('Revisione manuale in corso');
  expect(note).toContain('non sono verificati indipendentemente');
 });
 test('repairs missing punctuation on an already published verification note',async()=>{
  const linked='Almeno una fonte GitHub pubblica è stata collegata e ne è stata controllata la disponibilità. Contenuto, attribuzione e competenze non sono verificati indipendentemente.';
  const old='Attività dichiarate dal titolare. Il commit documenta modifiche ai moduli di identità e privacy. La disponibilità non certifica le competenze '+linked;
  const route='/api/knowledge-evidence/drafts/'+cardId+'/refresh-github-note';
  KnowledgeDraft.findOne.mockReturnValue({lean:async()=>({evidence:[{url}],verificationNote:old})});
  KnowledgeDraft.findOneAndUpdate.mockResolvedValue({_id:cardId,status:'published'});
  await request(app).post(route).set('Authorization',auth(alice)).send({confirm:true}).expect(200);
  const normalized=KnowledgeDraft.findOneAndUpdate.mock.calls[0][1].$set.verificationNote;
  expect(normalized).toContain('competenze. Almeno una fonte');
  expect(normalized.split(linked)).toHaveLength(2);
  KnowledgeDraft.findOne.mockReturnValue({lean:async()=>({evidence:[{url}],verificationNote:normalized})});
  KnowledgeDraft.findOneAndUpdate.mockClear();
  const repeat=await request(app).post(route).set('Authorization',auth(alice)).send({confirm:true}).expect(200);
  expect(repeat.body.unchanged).toBe(true);
  expect(KnowledgeDraft.findOneAndUpdate).not.toHaveBeenCalled();
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
