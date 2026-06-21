const express = require('express');
const router = express.Router();
const aiAgentController = require('../controllers/aiAgentController');

router.post('/', aiAgentController.handle);

module.exports = router;
