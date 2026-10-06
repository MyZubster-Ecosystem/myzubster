const mongoose = require('mongoose');
const MetaversePresence = require('../models/MetaversePresence');

const WORLD_ID = 'neon-plaza';
const PRESENCE_TTL_SECONDS = 90;

function databaseAvailable() {
  return mongoose.connection.readyState === 1;
}

async function buildPartyTelemetry() {
  const checkedAt = new Date();

  if (!databaseAvailable()) {
    return {
      worldId: WORLD_ID,
      status: 'degraded',
      lifecycle: 'prototype-live-space',
      transport: 'unavailable',
      storage: 'disconnected',
      activeParticipants: null,
      latestHeartbeatAgeMs: null,
      reconnect: {
        state: 'degraded',
        strategy: 'shared-polling',
        retryRecommended: true
      },
      surfaces: {
        stage: 'not-modeled',
        media: 'not-modeled',
        portals: 'not-modeled'
      },
      retention: {
        presenceSeconds: PRESENCE_TTL_SECONDS,
        permanentMovementHistory: false
      },
      checkedAt: checkedAt.toISOString()
    };
  }

  const [activeParticipants, latestPresence] = await Promise.all([
    MetaversePresence.countDocuments({
      worldId: WORLD_ID,
      expiresAt: { $gt: checkedAt }
    }),
    MetaversePresence.findOne({ worldId: WORLD_ID })
      .sort({ lastSeenAt: -1 })
      .select('lastSeenAt -_id')
      .lean()
  ]);

  const latestHeartbeatAt = latestPresence?.lastSeenAt
    ? new Date(latestPresence.lastSeenAt)
    : null;
  const latestHeartbeatAgeMs = latestHeartbeatAt && !Number.isNaN(latestHeartbeatAt.getTime())
    ? Math.max(0, checkedAt.getTime() - latestHeartbeatAt.getTime())
    : null;

  return {
    worldId: WORLD_ID,
    status: 'healthy',
    lifecycle: 'prototype-live-space',
    transport: 'shared-polling',
    storage: 'connected',
    activeParticipants,
    latestHeartbeatAgeMs,
    reconnect: {
      state: 'available',
      strategy: 'shared-polling',
      retryRecommended: false
    },
    surfaces: {
      stage: 'not-modeled',
      media: 'not-modeled',
      portals: 'not-modeled'
    },
    retention: {
      presenceSeconds: PRESENCE_TTL_SECONDS,
      permanentMovementHistory: false
    },
    checkedAt: checkedAt.toISOString()
  };
}

function summarizePartyTelemetry(telemetry) {
  const participants = telemetry.activeParticipants === null
    ? 'participant count unavailable'
    : `${telemetry.activeParticipants} active participant${telemetry.activeParticipants === 1 ? '' : 's'}`;

  return {
    status: telemetry.status,
    summary: `${telemetry.worldId} is ${telemetry.status}; ${participants}; transport ${telemetry.transport}.`,
    telemetry
  };
}

module.exports = {
  buildPartyTelemetry,
  summarizePartyTelemetry
};
