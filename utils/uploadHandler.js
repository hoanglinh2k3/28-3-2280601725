const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storageSetting = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + '-' + Math.round(Math.random() * 1000000000) + ext;
    cb(null, filename);
  }
});

const filterFile = function (req, file, cb) {
  const mimetype = file.mimetype;

  const isImage = mimetype.startsWith('image/');
  const isPdf = mimetype === 'application/pdf';
  const isExcel =
    mimetype === 'application/vnd.ms-excel' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (isImage || isPdf || isExcel) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload ảnh, PDF, Excel (.xls, .xlsx)'));
  }
};

module.exports = multer({
  storage: storageSetting,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: filterFile
});