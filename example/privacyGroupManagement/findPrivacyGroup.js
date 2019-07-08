const Web3 = require("web3");
const EEAClient = require("../../src");
const EventEmitterAbi = require("../solidity/EventEmitter/EventEmitter.json")
  .output.abi;

const { orion, pantheon } = require("../keys.js");

const web3 = new EEAClient(new Web3(pantheon.node1.url), 2018);
web3.eth.Contract(EventEmitterAbi);

const createPrivacyGroup = () => {
  const contractOptions = {
    addresses: [orion.node1.publicKey, orion.node2.publicKey],
    privateFrom: orion.node1.publicKey,
    name: "web3js-eea",
    description: "test"
  };
  return web3.eea.createPrivacyGroup(contractOptions);
};

const findPrivacyGroup = () => {
  const contractOptions = {
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  };
  return web3.eea.findPrivacyGroup(contractOptions);
};

module.exports = () => {
  createPrivacyGroup()
    .then(console.log)
    .catch(console.error);

  findPrivacyGroup()
    .then(console.log)
    .catch(console.error);
};

if (require.main === module) {
  module.exports();
}
