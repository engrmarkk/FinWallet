require('dotenv').config();
const { Worker } = require('bullmq');
const { connection } = require('../config/redis.js');
const { sendHtmlEmail } = require('../services/resendService');
const Logger = require('../utils/logger');

const logger = new Logger();

(async () => {
  try {
    logger.info('Got to the Email Worker');

    const emailWorker = new Worker(
      'send-email',
      async (job) => {
        logger.info(`job data: ${JSON.stringify(job)}`);
        if (job.name === 'send_email') {
          return await sendHtmlEmail(
            job.data.email,
            job.data.subject,
            job.data.htmlContent,
            job.data.templatePath,
            job.data.templateContext
          );
        }
      },
      { connection }
    );

    emailWorker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    emailWorker.on('failed', (job, err) => {
      console.log(`Job ${job.id} failed: ${err.message}`);
    });
  } catch (error) {
    logger.error('Connection failed@emailWorker: ' + error.message);
    process.exit(1);
  }
})();

// module.exports = { emailWorker };
