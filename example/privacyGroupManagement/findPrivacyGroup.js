const Web3 = require("web3");
const EEAClient = require("../../src");
const { orion, besu } = require("../keys.js");

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

const findPrivacyGroup = () => {
  const contractOptions = {
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  };
  return web3.priv.findPrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy groups found are:`, result);
    return result;
  });
};

const findPrivacyGroupForNode123 = () => {
  const contractOptions = {
    addresses: [
      orion.node1.publicKey,
      orion.node2.publicKey,
      orion.node3.publicKey
    ]
  };
  return web3.priv.findPrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy groups found are:`, result);
    return result;
  });
};

const findPrivacyGroupForNode23 = () => {
  const contractOptions = {
    addresses: [orion.node2.publicKey, orion.node3.publicKey]
  };
  return web3.priv.findPrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy groups found are:`, result);
    return result;
  });
};

module.exports = {
  findPrivacyGroup,
  findPrivacyGroupForNode123,
  findPrivacyGroupForNode23
};

if (require.main === module) {
  findPrivacyGroup();
}
