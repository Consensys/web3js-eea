const Web3 = require("web3");
const EEAClient = require("../../src");
const EventEmitterAbi = require("../solidity/EventEmitter/EventEmitter.json")
  .output.abi;

const { orion, pantheon } = require("../keys.js");

const web3 = new EEAClient(new Web3(pantheon.node1.url), 2018);
web3.eth.Contract(EventEmitterAbi);

const findPrivacyGroup = () => {
  const contractOptions = {
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  };
  return web3.eea.findPrivacyGroup(contractOptions).then(result => {
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
  return web3.eea.findPrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy groups found are:`, result);
    return result;
  });
};

const findPrivacyGroupForNode23 = () => {
  const contractOptions = {
    addresses: [orion.node2.publicKey, orion.node3.publicKey]
  };
  return web3.eea.findPrivacyGroup(contractOptions).then(result => {
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
