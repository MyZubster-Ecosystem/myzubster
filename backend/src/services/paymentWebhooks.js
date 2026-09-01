const crypto = require('crypto');
const axios = require('axios');

const EVENT_TYPES = Object.freeze({
  PAYMENT_CONFIRMED: 'payment.confirmed',
  ESCROW_RELEASED: 'escrow.released',
  BOUNTY_COMPLETED: 'bounty.completed',
});

const DEFAULT_REPLAY_WINDOW_MS = 5 * 60 * 1000;

function parseEndpoints(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function isTransientDeliveryError(error) {
  if (!error || !error.response) return true;
  const status = Number(error.response.status);
  return status === 408 || status === 429 || status >= 500;
}

function signaturesMatch(payload, signature, secret) {
  if (!signature || !secret) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const providedBuffer = Buffer.from(String(signature), 'utf8');
  return expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

class PaymentWebhookVerifier {
  constructor(options = {}) {
    this.secret = options.secret;
    this.replayStore = options.replayStore;
    this.maxAgeMs = options.maxAgeMs || DEFAULT_REPLAY_WINDOW_MS;
    this.now = options.now || (() => Date.now());
    if (!this.secret) throw new Error('A webhook signing secret is required');
    if (!this.replayStore || typeof this.replayStore.claim !== 'function') {
      throw new Error('A replay store with an atomic claim(deliveryId, expiresAt) method is required');
    }
  }

  async verify({ rawBody, signature, deliveryId }) {
    const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), 'utf8');
    if (!signaturesMatch(payload, signature, this.secret)) {
      throw new Error('Invalid webhook signature');
    }

    let event;
    try {
      event = JSON.parse(payload.toString('utf8'));
    } catch (_) {
      throw new Error('Invalid webhook payload');
    }
    if (!event.id || event.id !== deliveryId) {
      throw new Error('Webhook delivery ID does not match the signed event');
    }

    const createdAt = Date.parse(event.createdAt);
    const now = Number(this.now());
    if (!Number.isFinite(createdAt) || !Number.isFinite(now) || Math.abs(now - createdAt) > this.maxAgeMs) {
      throw new Error('Webhook event is outside the accepted timestamp window');
    }

    const expiresAt = new Date(createdAt + this.maxAgeMs).toISOString();
    if (!await this.replayStore.claim(event.id, expiresAt)) {
      throw new Error('Webhook delivery has already been processed');
    }
    return event;
  }
}

class PaymentWebhookDispatcher {
  constructor(options = {}) {
    this.endpoints = parseEndpoints(options.endpoints || process.env.PAYMENT_WEBHOOK_URLS);
    this.secret = options.secret || process.env.PAYMENT_WEBHOOK_SECRET || '';
    this.timeoutMs = options.timeoutMs || 5000;
    this.maxAttempts = options.maxAttempts || 3;
    this.request = options.request || axios.post.bind(axios);
    this.sleep = options.sleep || ((delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)));
    this.now = options.now || (() => new Date().toISOString());
    this.idFactory = options.idFactory || (() => crypto.randomUUID());
    if (this.endpoints.length > 0 && !this.secret) {
      throw new Error('PAYMENT_WEBHOOK_SECRET is required when payment webhooks are configured');
    }
  }

  createEvent(type, data) {
    if (!Object.values(EVENT_TYPES).includes(type)) {
      throw new Error(`Unsupported payment webhook event: ${type}`);
    }
    return {
      id: this.idFactory(),
      type,
      createdAt: this.now(),
      data,
    };
  }

  sign(payload) {
    if (!this.secret) return null;
    return `sha256=${crypto.createHmac('sha256', this.secret).update(payload).digest('hex')}`;
  }

  async deliver(endpoint, event) {
    const payload = JSON.stringify(event);
    const headers = {
      'content-type': 'application/json',
      'x-myzubster-event': event.type,
      'x-myzubster-delivery': event.id,
    };
    const signature = this.sign(payload);
    if (signature) headers['x-myzubster-signature-256'] = signature;

    let lastError;
    let attempts = 0;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      attempts = attempt;
      try {
        await this.request(endpoint, event, { headers, timeout: this.timeoutMs });
        return { endpoint, delivered: true, attempts: attempt };
      } catch (error) {
        lastError = error;
        if (!isTransientDeliveryError(error)) break;
        if (attempt < this.maxAttempts) await this.sleep(100 * (2 ** (attempt - 1)));
      }
    }

    return {
      endpoint,
      delivered: false,
      attempts,
      error: lastError && lastError.message ? lastError.message : 'Webhook delivery failed',
    };
  }

  async emit(type, data) {
    const event = this.createEvent(type, data);
    const deliveries = await Promise.all(this.endpoints.map((endpoint) => this.deliver(endpoint, event)));
    return { event, deliveries };
  }

  paymentConfirmed(payment) {
    return this.emit(EVENT_TYPES.PAYMENT_CONFIRMED, payment);
  }

  escrowReleased(escrow) {
    return this.emit(EVENT_TYPES.ESCROW_RELEASED, escrow);
  }

  bountyCompleted(bounty) {
    return this.emit(EVENT_TYPES.BOUNTY_COMPLETED, bounty);
  }
}

module.exports = {
  DEFAULT_REPLAY_WINDOW_MS,
  EVENT_TYPES,
  PaymentWebhookVerifier,
  PaymentWebhookDispatcher,
  isTransientDeliveryError,
  signaturesMatch,
  paymentWebhooks: new PaymentWebhookDispatcher(),
};
