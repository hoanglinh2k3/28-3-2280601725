const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const User = require('../schemas/users');
const Role = require('../schemas/roles');
const generateRandomPassword = require('../utils/randomPassword');
const { sendAccountMail } = require('../utils/importMailSender');

const MAIL_TO_OVERRIDE = process.env.MAIL_TO_OVERRIDE || 'nt.tung@hutech.edu.vn';

function normalizeRow(row) {
  return {
    username: row.username ? String(row.username).trim() : '',
    email: row.email ? String(row.email).trim().toLowerCase() : ''
  };
}

exports.importUsersFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload file Excel'
      });
    }

    const userRole =
      await Role.findOne({ name: 'USER', isDeleted: false }) ||
      await Role.findOne({ name: 'user', isDeleted: false });

    if (!userRole) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy role USER trong database'
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      raw: false
    });

    if (!rawRows.length) {
      return res.status(400).json({
        success: false,
        message: 'File Excel không có dữ liệu'
      });
    }

    const rows = rawRows.map(normalizeRow);

    const result = {
      total: rows.length,
      created: 0,
      skipped: 0,
      mailed: 0,
      errors: []
    };

    for (let i = 0; i < rows.length; i++) {
      const item = rows[i];
      const excelRow = i + 2;

      if (!item.username || !item.email) {
        result.skipped++;
        result.errors.push({
          row: excelRow,
          username: item.username,
          email: item.email,
          reason: 'Thiếu username hoặc email'
        });
        continue;
      }

      const existed = await User.findOne({
        $or: [{ username: item.username }, { email: item.email }]
      });

      if (existed) {
        result.skipped++;
        result.errors.push({
          row: excelRow,
          username: item.username,
          email: item.email,
          reason: 'Username hoặc email đã tồn tại'
        });
        continue;
      }

      const plainPassword = generateRandomPassword(16);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const newUser = new User({
        username: item.username,
        email: item.email,
        password: hashedPassword,
        role: userRole._id
      });

      await newUser.save();
      result.created++;

      try {
        const receiver = MAIL_TO_OVERRIDE || item.email;

        await sendAccountMail({
          to: receiver,
          username: item.username,
          password: plainPassword
        });

        result.mailed++;
      } catch (mailErr) {
        result.errors.push({
          row: excelRow,
          username: item.username,
          email: item.email,
          reason: `Tạo user thành công nhưng gửi mail thất bại: ${mailErr.message}`
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Import user hoàn tất',
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};