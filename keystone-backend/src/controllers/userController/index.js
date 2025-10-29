const { syncUser } = require('./syncUser');
const { getCurrentUser } = require('./getCurrentUser');
const { updateCurrentUser } = require('./updateUser');
const { deleteCurrentUser } = require('./deleteUser');

module.exports = {
  syncUser,
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser
};
