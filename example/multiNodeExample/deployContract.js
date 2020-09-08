const fs = require("fs");
const path = require("path");

const Web3 = require("web3");
const EEAClient = require("../../src");

const { orion, besu } = require("../keys.js");

const binary = fs.readFileSync(
  path.join(__dirname, "../solidity/EventEmitter/EventEmitter.bin")
);

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

const createPrivateEmitterContract = () => {
  const contractOptions = {
    data: `0x${binary}`,
    privateFrom: orion.node1.publicKey,
    privateFor: [orion.node2.publicKey],
    privateKey: besu.node1.privateKey
  };
  return web3.eea.sendRawTransaction(contractOptions);
};

const getPrivateContractAddress = transactionHash => {
  console.log("Transaction Hash ", transactionHash);
  return web3.priv
    .getTransactionReceipt(transactionHash, orion.node1.publicKey)
    .then(privateTransactionReceipt => {
      console.log("Private Transaction Receipt\n", privateTransactionReceipt);
      console.log(
        `now you have to run:\n export CONTRACT_ADDRESS=${
          privateTransactionReceipt.contractAddress
        }\n`
      );
      return privateTransactionReceipt.contractAddress;
    });
};

module.exports = () => {
  return createPrivateEmitterContract()
    .then(getPrivateContractAddress)
    .catch(error => {
      console.log(error);
      console.log(
        "\nThis example requires ONCHAIN privacy to be DISABLED. \nCheck config for ONCHAIN privacy groups."
      );
    });
};

if (require.main === module) {
  module.exports();
}
