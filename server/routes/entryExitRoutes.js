const express = require('express');
const router = express.Router();
const { verifyEntry, processExit } = require('../controllers/entryExitController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.use(protect);
// Only admin can process entry/exits (operators are treated as admin role here)
router.post('/verify', isAdmin, verifyEntry);
router.post('/exit', isAdmin, processExit);

module.exports = router;
