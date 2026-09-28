const express = require('express');
const router = express.Router();
const { createSlot, updateSlot } = require('../controllers/slotController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, isAdmin, createSlot);

router.route('/:id')
  .put(protect, isAdmin, updateSlot);

module.exports = router;
