const ZorgaxTopicDaily = require('../models/ZorgaxTopicDaily');

const TOPICS = [
  ['circular_project', /(?:economia circolare|progett[oi] circolar|ricicl|rius[oa]|rifiut)/i],
  ['university', /(?:universit|student|tesi|tirocin|ricerc|laborator|corso)/i],
  ['community', /(?:communit|community|collabor|contributor|conoscenz)/i],
  ['seller', /(?:seller|venditor|vendere|negozio)/i],
  ['marketplace', /(?:marketplace|annunc|comprare|acquist|prodotto)/i],
  ['metaverse', /(?:metavers|avatar|neon plaza)/i],
  ['life', /(?:\blife\b|agricol|ambient|sostenib|canapa|acqua)/i],
  ['event', /(?:party|event[oi]|musica|sound.?system|dj)/i],
  ['project', /(?:progett|realizz|costruir|svilupp|implement)/i]
];

function classifyTopic(message) {
  const value = String(message || '').slice(0, 4000);
  return TOPICS.find(([, pattern]) => pattern.test(value))?.[0] || 'other';
}

async function recordTopic({ message, now = new Date(), TopicModel = ZorgaxTopicDaily }) {
  const topic = classifyTopic(message);
  await TopicModel.findOneAndUpdate(
    { day: now.toISOString().slice(0, 10), topic },
    { $inc: { count: 1 } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  return topic;
}

module.exports = { classifyTopic, recordTopic };
