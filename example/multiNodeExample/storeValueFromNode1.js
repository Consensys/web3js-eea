const Web3 = require("web3");
const EEAClient = require("../../src");
const EventEmitter = require("../solidity/EventEmitter/EventEmitter.json");

const { orion, pantheon } = require("../keys.js");

if (!process.env.CONTRACT_ADDRESS) {
  throw Error("You need to export CONTRACT_ADDRESS=");
}

const storeValueFromNode1 = value => {
  const web3 = new EEAClient(new Web3(pantheon.node1.url), 2018);
  web3.eth.Contract(EventEmitter.abi);

  const functionAbi = EventEmitter.abi.find(e => {
    return e.name === "store";
  });
  const functionArgs = web3.eth.abi
    .encodeParameters(functionAbi.inputs, [value])
    .slice(2);

  const functionCall = {
    to: process.env.CONTRACT_ADDRESS,
    data: functionAbi.signature + functionArgs,
    privateFrom: orion.node1.publicKey,
    privateFor: [orion.node2.publicKey],
    privateKey: pantheon.node1.privateKey
  };
  return web3.eea.sendRawTransaction(functionCall).then(transactionHash => {
    return web3.eea
      .getTransactionReceipt(transactionHash, orion.node1.publicKey)
      .then(result => {
        console.log("Transaction Hash:", transactionHash);
        console.log("Event Emited:", result.logs[0].data);
      });
  });
};

const getValue = (url, privateFrom, privateFor, privateKey) => {
  const web3 = new EEAClient(new Web3(url), 2018);
  web3.eth.Contract(EventEmitter.abi);

  const functionAbi = EventEmitter.abi.find(e => {
    return e.name === "value";
  });

  const functionCall = {
    to: process.env.CONTRACT_ADDRESS,
    data: functionAbi.signature,
    privateFrom,
    privateFor,
    privateKey
  };

  return web3.eea.sendRawTransaction(functionCall).then(transactionHash => {
    return web3.eea
      .getTransactionReceipt(transactionHash, orion.node1.publicKey)
      .then(result => {
        console.log("Get Value from " + url + ":", result.output);
      });
  });
};

const getValueFromNode1 = () =>
  getValue(
    pantheon.node1.url,
    orion.node1.publicKey,
    [orion.node2.publicKey],
    pantheon.node1.privateKey
  );

const getValueFromNode2 = () =>
  getValue(
    pantheon.node2.url,
    orion.node2.publicKey,
    [orion.node1.publicKey],
    pantheon.node2.privateKey
  );

const getValueFromNode3 = () =>
  getValue(
    pantheon.node3.url,
    orion.node3.publicKey,
    [orion.node1.publicKey],
    pantheon.node3.privateKey
  );

storeValueFromNode1(1000)
  .then(getValueFromNode1)
  .then(getValueFromNode2)
  .then(getValueFromNode3);
