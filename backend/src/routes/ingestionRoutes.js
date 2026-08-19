const express = require('express');
const { status, trigger } = require('../controllers/ingestionController');

const router = express.Router();

router.get('/status', status);
router.post('/trigger', trigger);

module.exports = router;
