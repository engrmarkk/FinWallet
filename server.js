require('dotenv').config();
const mongoose = require('mongoose');
const errorHandler = require('./src/middlewares/errorHandler');
const pingRoute = require('./src/routes/pingRoute');
const authRoute = require('./src/routes/authRoute');
const userRoute = require('./src/routes/userRoute');

const express = require('express');
const app = express();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
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

app.use(errorHandler);
// listien to connection 'open' event, if its connected, run the server
mongoose.connection.on('open', () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
