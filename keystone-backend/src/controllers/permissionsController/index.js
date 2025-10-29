const { grantPermission } = require('./grantPermission');
const { revokePermission } = require('./revokePermission');
const { createShareLink } = require('./createShareLink');
const { getCategoryPermissions } = require('./getCategoryPermissions');
const { getGuestLinksForCategory } = require('./getGuestLinksForCategory');

module.exports = {
  grantPermission,
  revokePermission,
  createShareLink,
  getCategoryPermissions,
  getGuestLinksForCategory
};
