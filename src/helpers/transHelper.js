const { getTransactionCategoryById } = require('../dbCruds/transactionCrud');

const buildTransactionResponse = async (transaction) => {
  const cat = await getTransactionCategoryById(transaction.categoryId);

  return {
    ...transaction.toJSON(),
    category: cat.name,
  };
};

module.exports = {
  buildTransactionResponse,
};
