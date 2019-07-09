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
    privateFrom: "A1aVtMxLCUHmBVHXoZzzBrPbW/wj5axDpW9X8l91SGo=",
    name: "web3js-eea",
    description: "test"
  };
  return web3.eea.createPrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy group created is:`, result);
    return result;
  });
};

module.exports = {
  createPrivacyGroup
};

if (require.main === module) {
  createPrivacyGroup();
}
