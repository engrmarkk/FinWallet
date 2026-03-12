const cors = require('cors');

const allowedOrigins = ['http://localhost:4200', 'https://finwallet-ng.netlify.app'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
};

module.exports = cors(corsOptions);
