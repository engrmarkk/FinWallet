require('dotenv').config();
const mongoose = require('mongoose');
const { Worker } = require('bullmq');
const { connection } = require('../config/redis.js');
const { requeryVtpassTransaction } = require('../dbCruds/backgroundCrud.js');
const { saveVtpassResponse } = require('../dbCruds/backgroundCrud');
const Logger = require('../utils/logger');

const logger = new Logger();

(async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    logger.info('MongoDB connected successfully@vtpassWorker');

    const vtpassWorker = new Worker(
      'vtpass-requery',
      async (job) => {
        logger.info(`job data: ${JSON.stringify(job)}`);
        if (job.name === 'requery') {
          return await requeryVtpassTransaction(job.data);
        } else if (job.name === 'saveResponse') {
          return await saveVtpassResponse(job.data.request_id, job.data.content);
        }
      },
      { connection }
    );

    vtpassWorker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    vtpassWorker.on('failed', (job, err) => {
      console.log(`Job ${job.id} failed: ${err.message}`);
    });
  } catch (error) {
    logger.error('MongoDB connection failed@vtpassWorker: ' + error.message);
    process.exit(1);
  }
})();

// module.exports = { vtpassWorker };
