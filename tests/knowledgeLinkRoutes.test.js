const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const mongoose = require('mongoose');
jest.mock('../src/models/KnowledgeDraft', () => ({ find: jest.fn(), findOne: jest.fn() }));
jest.mock('../src/models/KnowledgeLink', () => ({
  find: jest.fn(), findOne: jest.fn(), create: jest.fn(), findOneAndUpdate: jest.fn()
}));
const KnowledgeDraft = require('../src/models/KnowledgeDraft');
const KnowledgeLink = require('../src/models/KnowledgeLink');
const routes = require('../src/routes/knowledgeLinkRoutes');
const alice = new mongoose.Types.ObjectId().toString(), bob = new mongoose.Types.ObjectId().toString();
const a = new mongoose.Types.ObjectId().toString(), b = new mongoose.Types.ObjectId().toString();
const linkId = new mongoose.Types.ObjectId().toString();
const app = express();app.use(express.json());app.use('/links',routes);
const auth = id => 'Bearer '+jwt.sign({ userId:id, role:'user' },process.env.JWT_SECRET);

describe('consensual knowledge connections',()=>{
  beforeEach(()=>{process.env.JWT_SECRET='test-knowledge-links';jest.clearAllMocks()});
  test('requires authentication and rejects malformed or identical cards',async()=>{
    await request(app).post('/links').send({sourceCardId:a,targetCardId:b,relation:'related_to',note:'Valid explanatory note'}).expect(401);
    await request(app).post('/links').set('Authorization',auth(alice)).send({sourceCardId:a,targetCardId:a,relation:'related_to',note:'Valid explanatory note'}).expect(400);
    await request(app).post('/links').set('Authorization',auth(alice)).send({sourceCardId:a,targetCardId:b,relation:'endorsed',note:'Valid explanatory note'}).expect(400);
    expect(KnowledgeLink.create).not.toHaveBeenCalled();
  });
  test('proposal requires owned public source and another public owner',async()=>{
    KnowledgeDraft.findOne.mockReturnValueOnce({select:()=>({lean:async()=>null})}).mockReturnValueOnce({select:()=>({lean:async()=>({ownerId:bob})})});
    await request(app).post('/links').set('Authorization',auth(alice)).send({sourceCardId:a,targetCardId:b,relation:'related_to',note:'These cards share a public method'}).expect(422);
    expect(KnowledgeDraft.findOne).toHaveBeenCalledWith({ _id:a,ownerId:alice,status:'published',visibility:'public' });
  });
  test('creates pending proposal without publishing it',async()=>{
    KnowledgeDraft.findOne.mockReturnValueOnce({select:()=>({lean:async()=>({ownerId:alice})})}).mockReturnValueOnce({select:()=>({lean:async()=>({ownerId:bob})})});
    KnowledgeLink.findOne.mockReturnValue({lean:async()=>null});
    KnowledgeLink.create.mockImplementation(async x=>({_id:linkId,...x}));
    const result=await request(app).post('/links').set('Authorization',auth(alice)).send({sourceCardId:a,targetCardId:b,relation:'complements',note:'Reproducible documentation complements API tests'}).expect(201);
    expect(result.body.status).toBe('pending');
    expect(KnowledgeLink.create).toHaveBeenCalledWith(expect.objectContaining({proposerId:alice,recipientId:bob,status:'pending'}));
  });
  test('only recipient can approve pending proposal while both cards remain public',async()=>{
    const candidate={_id:linkId,sourceCardId:a,targetCardId:b,proposerId:alice,recipientId:bob,status:'pending'};
    KnowledgeLink.findOne.mockReturnValueOnce({lean:async()=>null}).mockReturnValueOnce({lean:async()=>candidate});
    await request(app).post('/links/'+linkId+'/decision').set('Authorization',auth(alice)).send({decision:'accepted'}).expect(404);
    KnowledgeDraft.findOne.mockReturnValueOnce({select:()=>({lean:async()=>({_id:a})})}).mockReturnValueOnce({select:()=>({lean:async()=>({_id:b})})});
    KnowledgeLink.findOneAndUpdate.mockResolvedValue({...candidate,status:'accepted'});
    await request(app).post('/links/'+linkId+'/decision').set('Authorization',auth(bob)).send({decision:'accepted'}).expect(200);
    expect(KnowledgeLink.findOneAndUpdate.mock.calls[0][0]).toEqual({_id:linkId,recipientId:bob,status:'pending'});
  });
  test('rejects approval when source becomes private',async()=>{
    KnowledgeLink.findOne.mockReturnValue({lean:async()=>({_id:linkId,sourceCardId:a,targetCardId:b,proposerId:alice,recipientId:bob})});
    KnowledgeDraft.findOne.mockReturnValueOnce({select:()=>({lean:async()=>null})}).mockReturnValueOnce({select:()=>({lean:async()=>({_id:b})})});
    await request(app).post('/links/'+linkId+'/decision').set('Authorization',auth(bob)).send({decision:'accepted'}).expect(409);
    expect(KnowledgeLink.findOneAndUpdate).not.toHaveBeenCalled();
  });
  test('public endpoint filters revoked/private-card relationships and never returns owner identifiers',async()=>{
    KnowledgeLink.find.mockReturnValue({sort:()=>({limit:()=>({lean:async()=>[
      {_id:linkId,sourceCardId:a,targetCardId:b,proposerId:alice,recipientId:bob,relation:'related_to',note:'Public relationship',status:'accepted'},
      {_id:new mongoose.Types.ObjectId(),sourceCardId:a,targetCardId:new mongoose.Types.ObjectId(),relation:'related_to',note:'Private target'}
    ]})})});
    KnowledgeDraft.find.mockReturnValue({select:()=>({lean:async()=>[
      {_id:a,title:'Docker',publisherName:'Alice'}, {_id:b,title:'Telemetry',publisherName:'Bob'}
    ]})});
    const response=await request(app).get('/links/public').expect(200);
    expect(response.body.links).toHaveLength(1);
    expect(response.body.links[0]).not.toHaveProperty('proposerId');
    expect(response.body.links[0]).not.toHaveProperty('recipientId');
    expect(KnowledgeDraft.find.mock.calls[0][0]).toEqual(expect.objectContaining({status:'published',visibility:'public'}));
    expect(response.headers['cache-control']).toBe('no-store');
  });
  test('either involved account can withdraw without making a public record',async()=>{
    KnowledgeLink.findOneAndUpdate.mockResolvedValue({status:'withdrawn'});
    await request(app).post('/links/'+linkId+'/withdraw').set('Authorization',auth(alice)).expect(200);
    expect(KnowledgeLink.findOneAndUpdate.mock.calls[0][0].$or).toEqual([{proposerId:alice},{recipientId:alice}]);
  });
});
