const crypto = require('crypto');

function generateRandomPassword(length = 16) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const bytes = crypto.randomBytes(length * 2);

  let password = '';
  for (let i = 0; i < bytes.length && password.length < length; i++) {
    password += chars[bytes[i] % chars.length];
  }

  return password;
}

module.exports = generateRandomPassword;