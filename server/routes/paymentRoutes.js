const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getMyPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/my', getMyPayments);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

module.exports = router;
