'use strict';

const {
  createEthereumLoginChallenge,
  verifyEthereumLogin
} = require('../services/ethereumLoginService');

function statusFor(error) {
  const code = error?.code || '';
  if (code === 'ETHEREUM_WALLET_NOT_LINKED') return 409;
  if (code === 'ETHEREUM_LOGIN_CHALLENGE_MISSING') return 404;
  if (code === 'ETHEREUM_LOGIN_CHALLENGE_CONSUMED' || code === 'ETHEREUM_LOGIN_CHALLENGE_EXPIRED') return 409;
  if (code.startsWith('ETHEREUM_') || code.startsWith('INVALID_')) return 400;
  return 500;
}

exports.challenge = async (req, res) => {
  try {
    const data = await createEthereumLoginChallenge({
      address:req.body?.address,
      chainId:req.body?.chainId
    });
    res.set('Cache-Control','no-store');
    return res.status(201).json({
      success:true,
      data:{
        ...data,
        payment:false,
        gasRequired:false
      }
    });
  } catch (error) {
    return res.status(statusFor(error)).json({
      success:false,
      code:error?.code || 'ETHEREUM_LOGIN_CHALLENGE_FAILED',
      message:error?.message || 'Impossibile creare il challenge Ethereum'
    });
  }
};

exports.verify = async (req, res) => {
  try {
    const data = await verifyEthereumLogin({
      challengeId:req.body?.challengeId,
      message:req.body?.message,
      signature:req.body?.signature
    });
    res.set('Cache-Control','no-store');
    return res.json({ success:true, data });
  } catch (error) {
    return res.status(statusFor(error)).json({
      success:false,
      code:error?.code || 'ETHEREUM_LOGIN_VERIFY_FAILED',
      message:error?.message || 'Accesso Ethereum non riuscito'
    });
  }
};
