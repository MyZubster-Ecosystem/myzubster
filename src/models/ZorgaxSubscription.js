'use strict';

// Compatibility alias retained only so older imports do not create or query the
// deprecated ZorgaxSubscription collection. Paid Zorgax state now lives in
// ZorgaxPurchase + ZorgaxEntitlement.
module.exports = require('./ZorgaxPurchase').ZorgaxPurchase;
