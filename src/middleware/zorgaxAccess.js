'use strict';

const {
  getAccess,
  getAccessPolicy,
  guestAccess,
  meetsPlan,
  normalizePlan
} = require('../services/zorgaxAccessService');

function publicAccess(access) {
  return {
    plan: normalizePlan(access?.plan || access?.tier),
    tier: normalizePlan(access?.plan || access?.tier).toUpperCase(),
    status: access?.status || 'ACTIVE',
    active: access?.active !== false,
    source: access?.source || 'DEFAULT_FREE',
    startsAt: access?.startsAt || null,
    expiresAt: access?.expiresAt || null,
    features: Array.isArray(access?.features) ? access.features : []
  };
}

function createZorgaxAccessMiddleware({ getAccessFn = getAccess } = {}) {
  async function loadZorgaxAccess(req, res, next) {
    try {
      const access = req.userId ? await getAccessFn(req.userId) : guestAccess();
      req.zorgaxAccess = access;
      req.zorgaxPolicy = getAccessPolicy(access, { authenticated: Boolean(req.userId) });
      next();
    } catch (error) {
      res.status(503).json({ ok: false, error: 'Controllo accesso Zorgax non disponibile' });
    }
  }

  function requireZorgaxPlan(requiredPlan) {
    const normalizedRequiredPlan = normalizePlan(requiredPlan);

    return async (req, res, next) => {
      try {
        const access = req.zorgaxAccess || await getAccessFn(req.userId);
        req.zorgaxAccess = access;
        req.zorgaxPolicy = getAccessPolicy(access, { authenticated: true });

        if (!meetsPlan(access, normalizedRequiredPlan)) {
          return res.status(402).json({
            ok: false,
            error: `Piano Zorgax ${normalizedRequiredPlan} richiesto`,
            requiredPlan: normalizedRequiredPlan,
            access: publicAccess(access)
          });
        }

        return next();
      } catch (error) {
        return res.status(503).json({ ok: false, error: 'Controllo accesso Zorgax non disponibile' });
      }
    };
  }

  return {
    loadZorgaxAccess,
    requireZorgaxPlan
  };
}

module.exports = {
  createZorgaxAccessMiddleware,
  publicAccess
};

