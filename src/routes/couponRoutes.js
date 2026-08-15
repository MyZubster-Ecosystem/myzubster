const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

router.post('/create', couponController.createCoupon);
router.post('/redeem', couponController.redeemCoupon);
router.get('/user/:userId', couponController.getUserCoupons);

module.exports = router;
