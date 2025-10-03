const express = require('express');
const { testGHLConnection } = require('../controllers/testController');

const router = express.Router();

router.get('/ghl-connection', testGHLConnection);

module.exports = router;