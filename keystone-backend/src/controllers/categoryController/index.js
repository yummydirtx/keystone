const { createCategory } = require('./createCategory');
const { getCategories, getCategory } = require('./getCategories');
const { updateCategory } = require('./updateCategory');
const { deleteCategory } = require('./deleteCategory');
const { getSharedCategories } = require('./getSharedCategories');
const { getSubmitterCategories } = require('./getSubmitterCategories');
const { updateCategoryOptions } = require('./updateCategoryOptions');

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  getCategory,
  deleteCategory,
  getSharedCategories,
  getSubmitterCategories,
  updateCategoryOptions
};
