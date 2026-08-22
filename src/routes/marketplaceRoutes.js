const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const controller = require('../controllers/nftController');
const escrowController = require('../controllers/escrowMarketplaceController');
const escrowTxController = require('../controllers/escrowMarketplaceTxController');

const router = express.Router();
const marketplaceWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/', controller.listMarketplace);
router.get('/atomic', escrowController.listAtomicMarketplace);

router.post(
  '/atomic/tx-data',
  marketplaceWriteLimiter,
  auth.authenticate,
  escrowTxController.buildTransactionData
);

// Atomic escrow marketplace: the NFT is first placed in the escrow contract,
// then the backend registers only a transaction that is verified on-chain.
router.post(
  '/atomic/register',
  marketplaceWriteLimiter,
  auth.authenticate,
  escrowController.registerEscrowListing
);
router.post(
  '/atomic/:listingId/confirm-sale',
  marketplaceWriteLimiter,
  auth.authenticate,
  escrowController.confirmAtomicSale
);

// Legacy verified marketplace endpoints retained for backward compatibility.
router.post('/list', marketplaceWriteLimiter, auth.authenticate, controller.createListing);
router.post('/:listingId/confirm-sale', marketplaceWriteLimiter, auth.authenticate, controller.confirmSale);
router.post('/:listingId/cancel', marketplaceWriteLimiter, auth.authenticate, controller.cancelListing);

module.exports = router;
