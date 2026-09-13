'use strict';

// Compatibility alias retained only so older imports do not create or query the
// deprecated ZorgaxPaymentIntent collection. New Zorgax checkouts use the shared
// PaymentIntent model.
module.exports = require('./PaymentIntent');
