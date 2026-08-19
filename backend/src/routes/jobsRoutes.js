const express = require('express');
const { listJobs, getJobById, getStats } = require('../controllers/jobsController');

const router = express.Router();

router.get('/stats', getStats);
router.get('/:id', getJobById);
router.get('/', listJobs);

module.exports = router;
