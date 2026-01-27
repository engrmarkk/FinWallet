const { Queue } = require('bullmq');
const { connection } = require('../config/redis.js');

const vtpassQueue = new Queue('vtpass-requery', {
  connection,
});

module.exports = { vtpassQueue };
