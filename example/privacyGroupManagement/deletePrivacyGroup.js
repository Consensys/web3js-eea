const Web3 = require("web3");
const EEAClient = require("../../src");
const EventEmitterAbi = require("../solidity/EventEmitter/EventEmitter.json")
  .output.abi;

const { orion, pantheon } = require("../keys.js");

const web3 = new EEAClient(new Web3(pantheon.node1.url), 2018);
web3.eth.Contract(EventEmitterAbi);

const deletePrivacyGroup = givenPrivacyGroupId => {
  const contractOptions = {
    privacyGroupId: givenPrivacyGroupId,
    privateFrom: orion.node1.publicKey
  };
  return web3.eea.deletePrivacyGroup(contractOptions);
};

module.exports = privacyGroupId => {
  return deletePrivacyGroup(privacyGroupId)
    .then(console.log)
    .catch(console.error);
};

if (require.main === module) {
  if (process.argv.length.valueOf() !== 3) {
    throw Error(
      "You need to pass the privacy group to delete in the parameters"
    );
  }

  const privacyGroupId = process.argv[2];
  module.exports(privacyGroupId);
}
