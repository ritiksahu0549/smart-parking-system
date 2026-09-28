const express = require('express');
const router = express.Router();
const { updateSlotIotStatus } = require('../controllers/iotController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.patch('/slot/:id/status', protect, isAdmin, updateSlotIotStatus);

module.exports = router;
