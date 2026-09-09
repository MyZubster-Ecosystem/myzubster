const { eventHash, validateEvent, verifyEventSignature, buildMerkleTree } = require('./ahpTraceabilityService');

class MongoAhpTraceStore {
  constructor({ model, resolvePublicKey }) {
    this.model = model;
    this.resolvePublicKey = resolvePublicKey;
  }

  async append(event) {
    const errors = validateEvent(event);
    if (errors.length) throw new Error(errors.join('; '));
    const publicKey = this.resolvePublicKey(event.actor.keyId);
    if (!publicKey || !verifyEventSignature(event, publicKey)) throw new Error('invalid event signature');
    if (await this.model.exists({ eventId: event.eventId })) throw new Error('duplicate eventId');
    for (const previousId of event.previousEventIds || []) {
      if (!(await this.model.exists({ eventId: previousId, pilotId: event.pilotId }))) throw new Error(`unknown previous event: ${previousId}`);
    }
    const sequence = await this.model.countDocuments({ pilotId: event.pilotId }) + 1;
    const created = await this.model.create({ eventId: event.eventId, pilotId: event.pilotId,
      productLotId: event.subjects.productLotId || null, eventType: event.eventType,
      eventHash: eventHash(event), sequence, event });
    return { eventId: created.eventId, eventHash: created.eventHash, sequence: created.sequence };
  }

  async manifest({ pilotId, productLotId }) {
    const query = { pilotId };
    if (productLotId) query.productLotId = productLotId;
    const records = await this.model.find(query).sort({ sequence: 1 }).lean();
    if (!records.length) return null;
    const eventHashes = records.map(record => record.eventHash);
    const tree = buildMerkleTree(eventHashes);
    return { schemaVersion: '1.0.0', pilotId, productLotId: productLotId || null, eventCount: records.length, eventHashes, merkleRoot: tree.root, tree };
  }

  async publicLot(productLotId) {
    return this.model.find({ productLotId }).sort({ sequence: 1 }).select('eventId pilotId productLotId eventType eventHash sequence createdAt -_id').lean();
  }
}

module.exports = { MongoAhpTraceStore };
