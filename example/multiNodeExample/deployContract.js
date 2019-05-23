const Web3 = require("web3");
const EEAClient = require("../../src");
const EventEmitter = require("../solidity/EventEmitter/EventEmitter.json");

const { orion, pantheon } = require("../keys.js");

const web3 = new EEAClient(new Web3(pantheon.node1.url), 2018);
web3.eth.Contract(EventEmitter.abi);

const createPrivateEmitterContract = () => {
  const contractOptions = {
    data: `0x${EventEmitter.binary}`,
    privateFrom: orion.node1.publicKey,
    privateFor: [orion.node2.publicKey],
    privateKey: pantheon.node1.privateKey
  };
  return web3.eea.sendRawTransaction(contractOptions);
};

const getPrivateContractAddress = transactionHash => {
  console.log("Transaction Hash ", transactionHash);
  return web3.eea
    .getTransactionReceipt(transactionHash, orion.node1.publicKey)
    .then(privateTransactionReceipt => {
      console.log("Private Transaction Receipt\n", privateTransactionReceipt);
      return privateTransactionReceipt.contractAddress;
    });
};

module.exports = () => {
  return createPrivateEmitterContract()
    .then(getPrivateContractAddress)
    .catch(console.error);
};

if (require.main === module) {
  module.exports();
}
