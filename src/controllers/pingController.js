const { apiResponse } = require('../utils/apiResponse');
const { emailQueue } = require('../queues/email_queue');

exports.ping = async (req, res) => {
  // send otp
  await emailQueue.add('send_email', {
    email: 'mjay4k@gmail.com',
    subject: 'Test Email from FinWallet',
    htmlContent: null,
    templatePath: 'otpEmail.html',
    templateContext: {
      firstName: 'John',
      lastName: 'Doe',
      otp: '123456',
      expiryMinutes: 10,
    },
  });
  apiResponse(res, 'pong', 200);
};
