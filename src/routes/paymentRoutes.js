const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validateSystemKey } = require('../middleware/auth');

router.post('/create', validateSystemKey, paymentController.createPayment);
router.get('/status/:referenceId', validateSystemKey, paymentController.getPaymentStatus);
router.get('/all', validateSystemKey, paymentController.getAllPayments);

router.post('/pix/create', validateSystemKey, paymentController.createPixPayment);
router.get('/status/filter/:status', validateSystemKey, paymentController.getPaymentsByStatus);
router.get('/user/:userId', validateSystemKey, paymentController.getUserPayments);
router.post('/webhook', paymentController.webhookHandler);

module.exports = router;