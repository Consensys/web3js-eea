const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Web3 = require("web3");
const EEAClient = require("../../src");

const { orion, besu } = require("../keys.js");

const binary = fs.readFileSync(
  path.join(__dirname, "../solidity/Greeter/greeter.bin")
);

const greeterAbi = require("../solidity/Greeter/greeter_meta").output.abi;

const web3Node1 = new EEAClient(new Web3(besu.node1.url), 2018);
// const web3Node2 = new EEAClient(new Web3(besu.node2.url), 2018);

const createGreeterContract = privacyGroupId => {
  const contractOptions = {
    data: `0x${binary}`,
    privateFrom: orion.node1.publicKey,
    privacyGroupId,
    privateKey: besu.node1.privateKey
  };
  return web3Node1.eea.sendRawTransaction(contractOptions);
};

const getPrivateContractAddress = transactionHash => {
  return web3Node1.priv
    .getTransactionReceipt(transactionHash, orion.node1.publicKey)
    .then(privateTransactionReceipt => {
      return privateTransactionReceipt.contractAddress;
    });
};

const callGreeterFunction = (web3, address, privacyGroupId, method, value) => {
  const contract = new web3.eth.Contract(greeterAbi);

  // eslint-disable-next-line no-underscore-dangle
  const functionAbi = contract._jsonInterface.find(e => {
    return e.name === method;
  });

  const functionArgs =
    value !== null
      ? web3.eth.abi.encodeParameters(functionAbi.inputs, [value]).slice(2)
      : null;

  const functionCall = {
    to: address,
    data:
      functionArgs !== null
        ? functionAbi.signature + functionArgs
        : functionAbi.signature,
    privateFrom: orion.node1.publicKey,
    privateKey: besu.node1.privateKey,
    privacyGroupId
  };
  console.log(functionCall);
  return web3.eea
    .sendRawTransaction(functionCall)
    .then(privateTxHash => {
      console.log("Transaction Hash:", privateTxHash);
      return web3.priv.getTransactionReceipt(
        privateTxHash,
        orion.node1.publicKey
      );
    })
    .then(result => {
      return result;
    });
};

module.exports = async () => {
  const privacyGroupId = crypto.randomBytes(32).toString("base64");

  console.log(privacyGroupId);

  const creationResult = await web3Node1.privx.addToPrivacyGroup({
    participants: [orion.node1.publicKey, orion.node2.publicKey],
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privateKey: besu.node1.privateKey,
    privacyGroupId
  });

  console.log(Object.assign(creationResult, { a: "a" }));

  const transactionResult = await createGreeterContract(
    creationResult.privacyGroupId
  ).then(res => {
    return getPrivateContractAddress(res);
  });

  const greeterSetResult = await callGreeterFunction(
    web3Node1,
    transactionResult,
    creationResult.privacyGroupId,
    "setGreeting",
    "test"
  ).then(r => {
    return r;
  });

  console.log(greeterSetResult);

  const greeterGet = await callGreeterFunction(
    web3Node1,
    transactionResult,
    creationResult.privacyGroupId,
    "greet",
    null
  ).then(r => {
    return r;
  });

  console.log(greeterGet);

  const greeterFire = await callGreeterFunction(
    web3Node1,
    transactionResult,
    creationResult.privacyGroupId,
    "fire",
    null
  ).then(r => {
    return r;
  });

  console.log(greeterFire);

  //
  // node1.priv.distributeRawTransaction({
  //
  // });
  //
  // const node2Receipt = await node2.priv.getTransactionReceipt(
  //   creationResult.transactionHash,
  //   orion.node2.publicKey
  // );
  // console.log(node2Receipt);
};

if (require.main === module) {
  module.exports();
}
