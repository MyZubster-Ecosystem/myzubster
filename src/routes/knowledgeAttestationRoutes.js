const express = require('express');
const KnowledgeAttestation = require('../models/knowledgeAttestationModel');

const router = express.Router();

router.post('/', async (req,res)=>{
  try {

    const attestation = await KnowledgeAttestation.create({

      contributionId: String(req.body.contributionId),

      evidenceType: String(req.body.evidenceType),

      evidenceReference: String(req.body.evidenceReference),

      verifier: String(req.body.verifier),

      verificationMethod: String(req.body.verificationMethod),

      evidenceHash: req.body.evidenceHash || null

    });

    return res.json({
      success:true,
      attestation
    });

  } catch(error){

    return res.status(400).json({
      success:false,
      error:error.message
    });

  }
});


router.get('/:contributionId', async(req,res)=>{
  const items = await KnowledgeAttestation
    .find({
      contributionId:req.params.contributionId
    })
    .sort({createdAt:-1})
    .lean();

  res.json({
    success:true,
    items
  });
});


module.exports = router;
