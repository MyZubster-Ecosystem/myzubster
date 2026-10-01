const mongoose = require('mongoose');

const knowledgeAttestationSchema = new mongoose.Schema({

  contributionId: {
    type:String,
    required:true,
    index:true
  },

  evidenceType:{
    type:String,
    required:true
  },

  evidenceReference:{
    type:String,
    required:true
  },

  verifier:{
    type:String,
    required:true
  },

  verificationMethod:{
    type:String,
    required:true
  },

  observedAt:{
    type:Date,
    default:Date.now
  },

  evidenceHash:{
    type:String,
    default:null
  },

  status:{
    type:String,
    enum:[
      'OBSERVED',
      'VERIFIED',
      'REJECTED'
    ],
    default:'OBSERVED'
  }

},{timestamps:true});


knowledgeAttestationSchema.index({
  contributionId:1,
  verifier:1
});


module.exports = mongoose.model(
  'KnowledgeAttestation',
  knowledgeAttestationSchema
);
