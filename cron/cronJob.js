const cron = require('node-cron');
const { archiveAndCreateNewLedger } = require('../controllers/ledgerController');

// Cron job to archive ledger and create new one at midnight every day
cron.schedule('0 0 * * *', async () => {
  console.log('Running task at midnight...');
  await archiveAndCreateNewLedger();
});
