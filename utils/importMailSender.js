const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function sendAccountMail({ to, username, password }) {
  const subject = 'Tài khoản hệ thống của bạn';
  const html = `
    <h3>Chào bạn,</h3>
    <p>Tài khoản của bạn đã được tạo thành công.</p>
    <p><b>Username:</b> ${username}</p>
    <p><b>Password:</b> ${password}</p>
    <p>Vui lòng đăng nhập và đổi mật khẩu sau khi sử dụng lần đầu.</p>
  `;

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject,
    html
  });
}

module.exports = {
  sendAccountMail
};