const express = require('express');
const router = express.Router();

const importUpload = require('../utils/importUserUpload');
const { importUsersFromExcel } = require('../controllers/usersImport');

router.post('/import', importUpload.single('file'), importUsersFromExcel);

module.exports = router;