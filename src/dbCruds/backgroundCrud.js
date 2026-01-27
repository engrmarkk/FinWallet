const { Transaction, BillTransaction } = require('../models/transactionModel');
const Logger = require('../utils/logger');
const { VtpassService } = require('../integrations/vtpass/services');
const {
  createTransaction,
  creditOrDebitUserWallet,
  getTransactionByRef,
} = require('../dbCruds/transactionCrud');
const { generateReferences } = require('../utils/appUtil');

const vtpass = new VtpassService();

const logger = new Logger();

// refund transaction
const refundTransaction = async (transaction_ref) => {
  try {
    logger.info(`Refunding Vtpass transaction for transaction_id: ${transaction_ref}`);
    const transaction = await getTransactionByRef(transaction_ref);

    const ref = generateReferences(7);

    if (transaction) {
      const refunded_transaction = await createTransaction(
        transaction.userId,
        transaction.amount,
        transaction.type,
        transaction.categoryId,
        'refunded',
        'Refund transaction',
        ref,
        transaction.bankName,
        transaction.accountNumber,
        transaction.accountName,
        transaction.bankCode
      );

      transaction.status = 'failed';
      await transaction.save();

      await creditOrDebitUserWallet(transaction.userId, transaction.amount, 'credit');

      const billTrans = await BillTransaction.findOne({ reference: transaction_ref });
      if (billTrans) {
        billTrans.status = 'failed';
        await billTrans.save();
      }
    }
  } catch (error) {
    logger.error(`Error refunding Vtpass transaction for request_id: ${request_id} - ${error}`);
    throw error;
  }
};

const saveVtpassResponse = async (reference, responseData) => {
  try {
    logger.info(`Saving Vtpass response for reference: ${reference}`);
    logger.info(`Vtpass response data: ${JSON.stringify(responseData)}`);
    const transaction = await Transaction.findOne({ reference });
    if (transaction) {
      const billTransaction = await BillTransaction.findOne({ reference });
      transaction.status = ['delivered', 'initiated'].includes(responseData.transactions.status)
        ? 'completed'
        : responseData.transactions.status;
      billTransaction.status = ['delivered', 'initiated'].includes(responseData.transactions.status)
        ? 'completed'
        : responseData.transactions.status;

      billTransaction.token = responseData.purchased_code || '';
      billTransaction.unit = responseData.unit || '';
      billTransaction.customerName = responseData.customerName || '';
      billTransaction.customerAddress = responseData.customerAddress || '';
      billTransaction.billerName = responseData.transactions.product_name || '';
      billTransaction.billerType = responseData.transactions.type || '';

      await transaction.save();
      await billTransaction.save();
      logger.info(`Updated transaction and billTransaction for reference: ${reference}`);
      return { transaction, billTransaction };
    }
    logger.info(`Transaction with reference: ${reference} not found`);
    return null;
  } catch (error) {
    logger.error(`Error updating Vtpass response for reference: ${reference} - ${error}`);
    throw error;
  }
};

// requery vtpass transaction
const requeryVtpassTransaction = async (request_id) => {
  try {
    logger.info(`Requerying Vtpass transaction for request_id: ${request_id}`);
    const response = await vtpass.requeryTransaction(request_id);
    if (response.code === '000') {
      logger.info(`Requery successful for request_id: ${request_id}`);
      const res = await saveVtpassResponse(request_id, response.content);
      return res;
    } else if (response.code === '099') {
      throw new Error(`VTpass not ready: ${response.code}`);
    } else {
      logger.info(`Requery failed for request_id: ${request_id} with code: ${response.code}`);
      await refundTransaction(request_id);
    }
    logger.info(`Vtpass requery response: ${JSON.stringify(response)}`);
    return response;
  } catch (error) {
    logger.error(`Error requerying Vtpass transaction for request_id: ${request_id} - ${error}`);
    throw new Error(`VTpass not ready: ${response.code}`);
  }
};

module.exports = { saveVtpassResponse, requeryVtpassTransaction, refundTransaction };
