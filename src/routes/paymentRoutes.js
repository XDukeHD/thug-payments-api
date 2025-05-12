const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validateSystemKey } = require('../middleware/auth');

router.post('/credit-card', validateSystemKey, paymentController.createCreditCardPayment);

router.post('/pix', validateSystemKey, paymentController.createPixPayment);

router.post('/checkout', validateSystemKey, paymentController.createCheckoutPayment);

router.get('/status/:referenceId', validateSystemKey, paymentController.getPaymentStatus);
router.get('/all', validateSystemKey, paymentController.getAllPayments);
router.get('/status/filter/:status', validateSystemKey, paymentController.getPaymentsByStatus);
router.get('/user/:userId', validateSystemKey, paymentController.getUserPayments);

router.post('/webhook', paymentController.webhookHandler);

module.exports = router;