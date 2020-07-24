const fs = require("fs");
const path = require("path");

const Web3 = require("web3");
const EEAClient = require("../src");
const HumanStandardTokenAbi = require("./solidity/HumanStandardToken/HumanStandardToken.json")
  .output.abi;
const ethUtil = require("../src/custom-ethjs-util");
const { orion, besu } = require("./keys.js");

const binary = fs.readFileSync(
  path.join(__dirname, "./solidity/EventEmitter/EventEmitter.bin")
);

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

const contract = new web3.eth.Contract(HumanStandardTokenAbi);

// create HumanStandardToken constructor
// eslint-disable-next-line no-underscore-dangle
const constructorAbi = contract._jsonInterface.find(e => {
  return e.type === "constructor";
});
const constructorArgs = web3.eth.abi
  .encodeParameters(constructorAbi.inputs, [
    1000000,
    "PegaSys Token",
    10,
    "PegaSys"
  ])
  .slice(2);

const contractOptions = {
  data: `0x${binary}${constructorArgs}`,
  privateFrom: orion.node1.publicKey,
  privateFor: [orion.node1.publicKey],
  privateKey: besu.node1.privateKey
};

web3.eea
  .sendRawTransaction(contractOptions)
  .then(hash => {
    console.log(`Transaction Hash ${hash}`);
    return web3.priv.getTransactionReceipt(hash, orion.node1.publicKey);
  })
  .then(privateTransactionReceipt => {
    console.log("Private Transaction Receipt");
    console.log(privateTransactionReceipt);
    return privateTransactionReceipt.contractAddress;
  })
  .then(contractAddress => {
    // can we do a web3.eea.Contract? somehow need to override to use the eea.sendRawTransaction when invoking contract methods
    // const contract = web3.eth.Contract(HumandStandartTokenAbi, contractAddress);
    // contract.methods.transfer(["to", "value"]).send(??)

    // already 0x prefixed
    // eslint-disable-next-line no-underscore-dangle
    const functionAbi = contract._jsonInterface.find(element => {
      return element.name === "transfer";
    });
    const transferTo = `0x${ethUtil
      .privateToAddress(Buffer.from(besu.node2.privateKey, "hex"))
      .toString("hex")}`;
    const functionArgs = web3.eth.abi
      .encodeParameters(functionAbi.inputs, [transferTo, 1])
      .slice(2);

    return web3.eea.sendRawTransaction({
      to: contractAddress,
      data: functionAbi.signature + functionArgs,
      privateFrom: orion.node1.publicKey,
      privateFor: [orion.node2.publicKey],
      privateKey: besu.node1.privateKey
    });
  })
  .then(transactionHash => {
    console.log(`Transaction Hash ${transactionHash}`);
    return web3.priv.getTransactionReceipt(
      transactionHash,
      orion.node1.publicKey
    );
  })
  .then(privateTransactionReceipt => {
    console.log("Private Transaction Receipt");
    console.log(privateTransactionReceipt);
    if (privateTransactionReceipt.logs.length > 0) {
      console.log("Log 0");
      console.log(privateTransactionReceipt.logs[0]);
    }
    return privateTransactionReceipt;
  })
  .catch(e => {
    console.log(e);
  });
