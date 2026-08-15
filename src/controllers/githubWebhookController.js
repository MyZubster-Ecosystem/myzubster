const axios = require('axios');
const crypto = require('crypto');

const users = {
  'DanielIoni-creator': { walletAddress: '45M4DW1ug8bdQowWpxucTpgsfjLbVxbYaAra79VewmBobuuhgqTjyD4R3DzpqLM2veiphcB16n24qN1QbLg3y2PYGK3Qkoe', myzBalance: 100 }
};

const bountyHistory = [];

module.exports = {
  verifySignature: (payload, signature, secret) => {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature || ''), Buffer.from(expected));
  },

  handleIssueClosed: async (req, res) => {
    const { action, issue, sender, repository } = req.body;

    if (action !== 'closed') {
      return res.status(200).send('Evento ignorato');
    }

    const hasBountyLabel = issue.labels.some(label => label.name === 'bounty');
    if (!hasBountyLabel) {
      return res.status(200).send('Issue senza bounty');
    }

    const rewardMatch = issue.body.match(/💰 Ricompensa\s*[:：]\s*(\d+)\s*MYZ/i);
    if (!rewardMatch) {
      return res.status(200).send('Reward non specificato');
    }
    const rewardAmount = parseInt(rewardMatch[1], 10);

    const githubUser = sender.login;
    const user = users[githubUser];
    if (!user) {
      console.error(`❌ Utente ${githubUser} non trovato`);
      return res.status(404).send('Utente non trovato');
    }

    user.myzBalance = (user.myzBalance || 0) + rewardAmount;

    bountyHistory.push({
      issueId: issue.id,
      issueUrl: issue.html_url,
      title: issue.title,
      assignee: githubUser,
      reward: rewardAmount,
      assignedAt: new Date().toISOString(),
      repository: repository.full_name
    });

    console.log(`✅ Bounty assegnato: ${rewardAmount} MYZ a ${githubUser}`);
    console.log(`   Issue: ${issue.html_url}`);
    console.log(`   Saldo attuale: ${user.myzBalance} MYZ`);

    res.status(200).send('Bounty assegnato');
  },

  registerUser: (req, res) => {
    const { githubUsername, walletAddress } = req.body;
    if (!githubUsername || !walletAddress) {
      return res.status(400).json({ error: 'Mancano campi obbligatori' });
    }
    users[githubUsername] = { walletAddress, myzBalance: 0 };
    res.json({ success: true, message: `Utente ${githubUsername} registrato` });
  },

  getBountyHistory: (req, res) => {
    res.json({ success: true, count: bountyHistory.length, history: bountyHistory });
  },

  getUserBalance: (req, res) => {
    const { githubUsername } = req.params;
    const user = users[githubUsername];
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    res.json({ success: true, githubUsername, walletAddress: user.walletAddress, myzBalance: user.myzBalance });
  }
};
