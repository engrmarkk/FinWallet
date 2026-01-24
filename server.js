require('dotenv').config();
const mongoose = require('mongoose');
const errorHandler = require('./src/middlewares/errorHandler');
const pingRoute = require('./src/routes/pingRoute');
const authRoute = require('./src/routes/authRoute');
const userRoute = require('./src/routes/userRoute');
const transactionRoute = require('./src/routes/transactions/transactionRoute');
const billTransactionRoute = require('./src/routes/transactions/billTransactionRoute');
const miscRoute = require('./src/routes/miscRoute');
const corsMiddleware = require('./src/middlewares/corsMiddleware');
const express = require('express');
const Logger = require('./src/utils/logger');

const logger = new Logger();

const app = express();

app.use(corsMiddleware);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.APP_PORT || 3000;
const apiVersion = '/api/v1';

app.use(express.json());
app.use(`${apiVersion}/ping`, pingRoute);
app.use(`${apiVersion}/auth`, authRoute);
app.use(`${apiVersion}/user`, userRoute);
app.use(`${apiVersion}/transactions`, transactionRoute);
app.use(`${apiVersion}/bill-transactions`, billTransactionRoute);
app.use(`${apiVersion}/misc`, miscRoute);

app.use(errorHandler);
// listien to connection 'open' event, if its connected, run the server
mongoose.connection.on('open', () => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
});
