const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validateSystemKey } = require('../middleware/auth');

// Standard payment routes
router.post('/create', validateSystemKey, paymentController.createPayment);
router.get('/status/:referenceId', validateSystemKey, paymentController.getPaymentStatus);
router.get('/all', validateSystemKey, paymentController.getAllPayments);

// PIX specific payment route
router.post('/pix/create', validateSystemKey, paymentController.createPixPayment);

// Status management routes
router.get('/status/filter/:status', validateSystemKey, paymentController.getPaymentsByStatus);

// User-specific payment routes
router.get('/user/:userId', validateSystemKey, paymentController.getUserPayments);

// Webhook handler (no system key required as it's called by PagBank)
router.post('/webhook', paymentController.webhookHandler);

module.exports = router;