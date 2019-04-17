const Web3 = require("web3");
const EEAClient = require("../src");
const EventEmitter = require("./solidity/EventEmitter/EventEmitter.json");

const { orion, pantheon } = require("./keys.js");

const web3 = new EEAClient(new Web3(pantheon.node1.url), 2018);
// pass by reference monkey patch
// gives us `signature` field on abi items
web3.eth.Contract(EventEmitter.abi);

const createPrivateEmitterContract = () => {
  const contractOptions = {
    data: "0x" + EventEmitter.binary,
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

const storeValue = (contractAddress, value) => {
  const functionAbi = EventEmitter.abi.find(e => {
    return e.name === "store";
  });
  const functionArgs = web3.eth.abi
    .encodeParameters(functionAbi.inputs, [value])
    .slice(2);

  const functionCall = {
    to: contractAddress,
    data: functionAbi.signature + functionArgs,
    privateFrom: orion.node1.publicKey,
    privateFor: [orion.node2.publicKey],
    privateKey: pantheon.node1.privateKey
  };
  return web3.eea.sendRawTransaction(functionCall);
};

const getValue = contractAddress => {
  const functionAbi = EventEmitter.abi.find(e => {
    return e.name === "value";
  });

  const functionCall = {
    to: contractAddress,
    data: functionAbi.signature,
    privateFrom: orion.node1.publicKey,
    privateFor: [orion.node2.publicKey],
    privateKey: pantheon.node1.privateKey
  };

  return web3.eea.sendRawTransaction(functionCall).then(transactionHash => {
    return web3.eea
      .getTransactionReceipt(transactionHash, orion.node1.publicKey)
      .then(result => {
        console.log("Get Value:", result.output);
      });
  });
};

const getPrivateTransactionReceipt = transactionHash => {
  return web3.eea
    .getTransactionReceipt(transactionHash, orion.node1.publicKey)
    .then(result => {
      console.log("Transaction Hash:", transactionHash);
      console.log("Event Emited:", result.logs[0].data);
    });
};

createPrivateEmitterContract()
  .then(getPrivateContractAddress)
  .then(contractAddress => {
    return storeValue(contractAddress, 1000)
      .then(transactionHash => getPrivateTransactionReceipt(transactionHash))
      .then(() => getValue(contractAddress))
      .then(() => storeValue(contractAddress, 42))
      .then(transactionHash => getPrivateTransactionReceipt(transactionHash))
      .then(() => getValue(contractAddress));
  });
