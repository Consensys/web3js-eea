const Web3 = require("web3");
const EEAClient = require("../../src");
const { besu } = require("../keys.js");

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

const deletePrivacyGroup = givenPrivacyGroupId => {
  const contractOptions = {
    privacyGroupId: givenPrivacyGroupId
  };
  return web3.priv.deletePrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy group deleted is:`, result);
    return result;
  });
};

module.exports = {
  deletePrivacyGroup
};

if (require.main === module) {
  if (!process.env.PRIVACY_GROUP_TO_DELETE) {
    throw Error(
      "You need to export the following variable in your shell environment: PRIVACY_GROUP_TO_DELETE="
    );
  }

  const privacyGroupId = process.env.PRIVACY_GROUP_TO_DELETE;
  deletePrivacyGroup(privacyGroupId).catch(error => {
    console.log(error);
    console.log(
      `\nAttempted to delete PRIVACY_GROUP_TO_DELETE=${privacyGroupId}`
    );
    console.log("You may need to update PRIVACY_GROUP_TO_DELETE");
  });
}
