const express = require('express');
const router = express.Router();
const { getPublicStatement } = require('../controllers/farmerController');

router.get('/farmers/:id/statement', getPublicStatement);

module.exports = router;