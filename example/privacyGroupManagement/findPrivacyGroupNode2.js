const Web3 = require("web3");
const EEAClient = require("../../src");
const { orion, besu } = require("../keys.js");

const web3 = new EEAClient(new Web3(besu.node2.url), 2018);

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
  findPrivacyGroupForNode23
};

if (require.main === module) {
  findPrivacyGroupForNode23();
}
