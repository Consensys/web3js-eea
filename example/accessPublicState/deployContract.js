const fs = require("fs");
const path = require("path");

const Web3 = require("web3");
const Tx = require("ethereumjs-tx");
const EEAClient = require("../../src");

const { orion, besu } = require("../keys.js");

const binaryEventEmitter = fs.readFileSync(
  path.join(__dirname, "../solidity/EventEmitter/EventEmitter.bin")
);

const binaryCrossContractReader = fs.readFileSync(
  path.join(
    __dirname,
    "../solidity/CrossContractReader/CrossContractReader.bin"
  )
);

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);
let logBuffer = "";

const createPublicEventEmitter = () => {
  const besuAccount = web3.eth.accounts.privateKeyToAccount(
    `0x${besu.node1.privateKey}`
  );
  return web3.eth
    .getTransactionCount(besuAccount.address, "pending")
    .then(count => {
      const rawTx = {
        nonce: web3.utils.numberToHex(count),
        from: besuAccount.address,
        value: 0,
        to: null,
        data: `0x${binaryEventEmitter}`,
        gasPrice: "0xFFFFF",
        gasLimit: "0xFFFFFF"
      };
      const tx = new Tx(rawTx);
      tx.sign(Buffer.from(besu.node1.privateKey, "hex"));
      const serializedTx = tx.serialize();
      return web3.eth.sendSignedTransaction(
        `0x${serializedTx.toString("hex")}`
      );
    })
    .then(transactionReceipt => {
      console.log("Public Transaction Receipt\n", transactionReceipt);
      logBuffer += `now you have to run:\n export PUBLIC_CONTRACT_ADDRESS=${
        transactionReceipt.contractAddress
      }\n`;
      return transactionReceipt.contractAddress;
    });
};

const createPrivateCrossContractReader = () => {
  const contractOptions = {
    data: `0x${binaryCrossContractReader}`,
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
      logBuffer += ` export PRIVATE_CONTRACT_ADDRESS=${
        privateTransactionReceipt.contractAddress
      }`;
      console.log(logBuffer);
      return privateTransactionReceipt.contractAddress;
    });
};

module.exports = () => {
  return createPublicEventEmitter()
    .then(createPrivateCrossContractReader)
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
