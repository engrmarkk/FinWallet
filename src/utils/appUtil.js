// import brcrpt
const bcrypt = require('bcrypt');
const validator = require('validator');
const crypto = require('crypto');
const { format } = require('date-fns');

// function to generate secure OTP
const generateSecureOTP = async () => {
  const otp = crypto.randomInt(0, 1000000);
  return otp.toString().padStart(6, '0');
};

const generateAccountNumber = () => {
  // generate 8 random digits (00000000 to 99999999)
  const randomPart = crypto.randomInt(0, 100_000_000);

  // pad with leading zeros if needed
  const randomPartStr = randomPart.toString().padStart(8, '0');

  // prepend '91'
  return `91${randomPartStr}`;
};

// function to hash password
const hashPassword = async (password) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

// function to compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const validateEmail = async (email) => {
  return await validator.isEmail(email);
};

const formatDate = (date) => {
  return format(new Date(date), 'dd-MM-yy HH:mm:ss');
};

function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = {
  generateSecureOTP,
  hashPassword,
  comparePassword,
  validateEmail,
  formatDate,
  generateAccountNumber,
  toTitleCase,
};
