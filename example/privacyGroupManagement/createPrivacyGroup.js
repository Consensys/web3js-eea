const Web3 = require("web3");
const EEAClient = require("../../src");
const { orion, pantheon } = require("../keys.js");

const web3 = new EEAClient(new Web3(pantheon.node1.url), 2018);

const createPrivacyGroup = () => {
  const contractOptions = {
    addresses: [orion.node1.publicKey, orion.node2.publicKey],
    privateFrom: orion.node1.publicKey,
    name: "web3js-eea",
    description: "test"
  };
  return web3.priv.createPrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy group created is:`, result);
    return result;
  });
};

const createPrivacyGroupForNode123 = () => {
  const contractOptions = {
    addresses: [
      orion.node1.publicKey,
      orion.node2.publicKey,
      orion.node3.publicKey
    ],
    privateFrom: orion.node1.publicKey,
    name: "web3js-eea",
    description: "test"
  };
  return web3.priv.createPrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy group created is:`, result);
    return result;
  });
};

module.exports = {
  createPrivacyGroup,
  createPrivacyGroupForNode123
};

if (require.main === module) {
  createPrivacyGroup();
}
