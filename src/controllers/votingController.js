const VotingPoll = require('../models/VotingPoll');
const Vote = require('../models/Vote');

exports.createPoll = async (req, res) => {
  try {
    const { title, description, topic, options, durationHours, votingType } = req.body;
    if (!title || !options || options.length < 2) {
      return res.status(400).json({ success: false, message: 'Title and at least 2 options required' });
    }
    const validTypes = ['simple', 'weighted', 'quadratic'];
    const vType = validTypes.includes(votingType) ? votingType : 'simple';
    const endDate = new Date(Date.now() + (durationHours || 72) * 3600000);
    const poll = new VotingPoll({
      title,
      description: description || '',
      topic: topic || 'general',
      votingType: vType,
      options: options.map(text => ({ text, votes: 0 })),
      endDate,
      createdBy: req.userId
    });
    await poll.save();
    res.status(201).json({ success: true, message: 'Poll created', data: poll });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ success: false, message: 'Error creating poll', error: error.message });
  }
};

exports.getPolls = async (req, res) => {
  try {
    const { topic, active, limit = 20, page = 1 } = req.query;
    const query = {};
    if (topic) query.topic = topic;
    if (active === 'true') { query.status = 'active'; query.endDate = { $gt: new Date() }; }
    else if (active === 'false') { query.$or = [{ status: 'closed' }, { endDate: { $lte: new Date() } }]; }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const polls = await VotingPoll.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('createdBy', 'username');
    const total = await VotingPoll.countDocuments(query);
    res.json({ success: true, count: polls.length, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), data: polls });
  } catch (error) {
    console.error('Get polls error:', error);
    res.status(500).json({ success: false, message: 'Error fetching polls', error: error.message });
  }
};

exports.getPoll = async (req, res) => {
  try {
    const poll = await VotingPoll.findById(req.params.id).populate('createdBy', 'username');
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    const userVote = await Vote.findOne({ pollId: poll._id, voterId: req.userId });
    const ended = new Date(poll.endDate) < new Date();
    res.json({ success: true, data: { ...poll.toObject(), ended, userVote: userVote ? userVote.optionIndex : null } });
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({ success: false, message: 'Error fetching poll', error: error.message });
  }
};

exports.vote = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const poll = await VotingPoll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    if (poll.status === 'closed' || new Date(poll.endDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Voting has ended' });
    }
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ success: false, message: 'Invalid option' });
    }
    const existing = await Vote.findOne({ pollId: poll._id, voterId: req.userId });
    if (existing) return res.status(409).json({ success: false, message: 'Already voted' });
    let weight = 1;
    if (poll.votingType === 'quadratic') {
      weight = Math.round(Math.sqrt(1 + poll.totalVoters)) || 1;
    }
    const vote = new Vote({ pollId: poll._id, voterId: req.userId, optionIndex, weight });
    await vote.save();
    poll.options[optionIndex].votes += weight;
    poll.totalVoters += 1;
    await poll.save();
    res.json({ success: true, message: 'Vote cast', votingType: poll.votingType, weight });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ success: false, message: 'Error casting vote', error: error.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const poll = await VotingPoll.findById(req.params.id).populate('createdBy', 'username');
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
    const ended = new Date(poll.endDate) < new Date();
    const options = poll.options.map((o, i) => ({
      index: i, text: o.text, votes: o.votes,
      percentage: totalVotes > 0 ? Math.round(o.votes / totalVotes * 100) : 0
    }));
    res.json({ success: true, data: { ...poll.toObject(), ended, totalVotes, options } });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ success: false, message: 'Error fetching results', error: error.message });
  }
};

exports.closePoll = async (req, res) => {
  try {
    const poll = await VotingPoll.findById(req.params.id);
    if (!poll) return res.status(404).json({ success: false, message: 'Poll not found' });
    if (poll.status === 'closed') return res.status(400).json({ success: false, message: 'Already closed' });
    poll.status = 'closed';
    await poll.save();
    res.json({ success: true, message: 'Poll closed', data: poll });
  } catch (error) {
    console.error('Close poll error:', error);
    res.status(500).json({ success: false, message: 'Error closing poll', error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const polls = await VotingPoll.find({ status: 'closed' }).sort({ endDate: -1 }).limit(50).populate('createdBy', 'username');
    res.json({ success: true, count: polls.length, data: polls });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Error fetching history', error: error.message });
  }
};
