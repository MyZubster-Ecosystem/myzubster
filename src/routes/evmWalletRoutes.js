'use strict';

const express = require('express');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { createLinkChallenge, verifyLinkChallenge } = require('../services/evmWalletLinkService');

const router = express.Router();

function statusFor(error) {
  const code = error?.code;
  if (['INVALID_EVM_ADDRESS','INVALID_CHAIN_ID','WALLET_MESSAGE_MISMATCH','INVALID_WALLET_SIGNATURE','WALLET_SIGNER_MISMATCH','WALLET_ADDRESS_MISMATCH'].includes(code)) return 400;
  if (['WALLET_CHALLENGE_EXPIRED','WALLET_CHALLENGE_MISSING'].includes(code)) return 409;
  return 500;
}

function publicWalletState(user) {
  const wallet = user?.evmWallet || {};
  return {
    status: wallet.status || 'WALLET_NOT_CONNECTED',
    walletType: wallet.walletType || 'EVM',
    provider: wallet.provider || null,
    address: wallet.address || null,
    chainId: wallet.chainId || null,
    verifiedAt: wallet.verifiedAt || null,
    lastVerifiedAt: wallet.lastVerifiedAt || null
  };
}

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('evmWallet');
    if (!user) return res.status(404).json({ success:false, code:'USER_NOT_FOUND', message:'Utente non trovato' });
    res.set('Cache-Control', 'no-store');
    return res.json({ success:true, data:publicWalletState(user) });
  } catch (error) {
    return res.status(500).json({ success:false, code:'WALLET_STATE_UNAVAILABLE', message:'Impossibile leggere il wallet collegato' });
  }
});

router.post('/challenge', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('+evmWallet.linkChallenge');
    if (!user) return res.status(404).json({ success:false, code:'USER_NOT_FOUND', message:'Utente non trovato' });

    const challenge = createLinkChallenge({
      userId:req.userId,
      address:req.body?.address,
      chainId:req.body?.chainId
    });

    user.evmWallet = user.evmWallet || {};
    user.evmWallet.walletType = 'EVM';
    user.evmWallet.provider = 'metamask';
    user.evmWallet.status = 'WALLET_CHALLENGE_PENDING';
    user.evmWallet.linkChallenge = challenge.stored;
    await user.save();

    console.info(JSON.stringify({
      event:'evm_wallet_challenge_created',
      userId:String(req.userId),
      chainId:challenge.public.chainId,
      address:challenge.public.address
    }));

    res.set('Cache-Control', 'no-store');
    return res.status(201).json({ success:true, data:challenge.public });
  } catch (error) {
    return res.status(statusFor(error)).json({ success:false, code:error?.code || 'WALLET_CHALLENGE_FAILED', message:error?.message || 'Impossibile creare il challenge wallet' });
  }
});

router.post('/verify', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('+evmWallet.linkChallenge');
    if (!user) return res.status(404).json({ success:false, code:'USER_NOT_FOUND', message:'Utente non trovato' });

    const verified = verifyLinkChallenge({
      challenge:user.evmWallet?.linkChallenge,
      address:req.body?.address,
      message:req.body?.message,
      signature:req.body?.signature
    });

    const alreadyLinked = await User.findOne({
      _id:{ $ne:user._id },
      'evmWallet.address':verified.address,
      'evmWallet.status':'WALLET_VERIFIED'
    }).select('_id');

    if (alreadyLinked) {
      return res.status(409).json({ success:false, code:'WALLET_ALREADY_LINKED', message:'Questo wallet è già collegato a un altro account MyZubster' });
    }

    const now = new Date();
    user.evmWallet.walletType = 'EVM';
    user.evmWallet.provider = 'metamask';
    user.evmWallet.address = verified.address;
    user.evmWallet.chainId = verified.chainId;
    user.evmWallet.status = 'WALLET_VERIFIED';
    user.evmWallet.verifiedAt = user.evmWallet.verifiedAt || now;
    user.evmWallet.lastVerifiedAt = now;
    user.evmWallet.linkChallenge = undefined;
    await user.save();

    console.info(JSON.stringify({
      event:'evm_wallet_link_verified',
      userId:String(req.userId),
      chainId:verified.chainId,
      address:verified.address
    }));

    res.set('Cache-Control', 'no-store');
    return res.json({ success:true, data:publicWalletState(user) });
  } catch (error) {
    return res.status(statusFor(error)).json({ success:false, code:error?.code || 'WALLET_VERIFY_FAILED', message:error?.message || 'Impossibile verificare il wallet' });
  }
});

router.delete('/disconnect', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('+evmWallet.linkChallenge');
    if (!user) return res.status(404).json({ success:false, code:'USER_NOT_FOUND', message:'Utente non trovato' });

    const previousAddress = user.evmWallet?.address || null;
    user.evmWallet = {
      walletType:'EVM',
      provider:'metamask',
      status:'WALLET_DISCONNECTED'
    };
    await user.save();

    console.info(JSON.stringify({
      event:'evm_wallet_disconnected',
      userId:String(req.userId),
      address:previousAddress
    }));

    res.set('Cache-Control', 'no-store');
    return res.json({ success:true, data:publicWalletState(user) });
  } catch (error) {
    return res.status(500).json({ success:false, code:'WALLET_DISCONNECT_FAILED', message:'Impossibile scollegare il wallet' });
  }
});

module.exports = router;
