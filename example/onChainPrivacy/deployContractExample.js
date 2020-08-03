const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const EEAClient = require("../../src");

const { orion, besu } = require("../keys.js");

const binary = fs.readFileSync(
  path.join(__dirname, "../solidity/Greeter/greeter.bin")
);

const greeterAbi = require("../solidity/Greeter/greeter_meta").output.abi;

const web3Node1 = new EEAClient(new Web3(besu.node1.url), 2018);
const web3Node2 = new EEAClient(new Web3(besu.node2.url), 2018);

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

const callGenericFunctionOnContract = (
  web3,
  privateFrom,
  privateKey,
  address,
  privacyGroupId,
  method,
  value
) => {
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
    privateFrom,
    privateKey,
    privacyGroupId
  };
  return web3.eea
    .sendRawTransaction(functionCall)
    .then(privateTxHash => {
      console.log("Transaction Hash:", privateTxHash);
      return web3.priv.getTransactionReceipt(privateTxHash, privateFrom);
    })
    .then(result => {
      return result;
    });
};

module.exports = async () => {
  const privacyGroupCreationResult = await web3Node1.privx.createPrivacyGroup({
    participants: [orion.node1.publicKey, orion.node2.publicKey],
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privateKey: besu.node1.privateKey
  });

  console.log(privacyGroupCreationResult);

  const greeterContractAddress = await createGreeterContract(
    privacyGroupCreationResult.privacyGroupId
  ).then(res => {
    return getPrivateContractAddress(res);
  });

  const callGreetFunctionResult = await callGenericFunctionOnContract(
    web3Node1,
    orion.node1.publicKey,
    besu.node1.privateKey,
    greeterContractAddress,
    privacyGroupCreationResult.privacyGroupId,
    "greet",
    null
  ).then(r => {
    return r;
  });

  console.log(callGreetFunctionResult);

  const callSetGreetingFunctionResultFromSecondParticipant = await callGenericFunctionOnContract(
    web3Node2,
    orion.node2.publicKey,
    besu.node2.privateKey,
    greeterContractAddress,
    privacyGroupCreationResult.privacyGroupId,
    "setGreeting",
    "test"
  ).then(r => {
    return r;
  });

  console.log(callSetGreetingFunctionResultFromSecondParticipant);

  const callFireEventFunctionResult = await callGenericFunctionOnContract(
    web3Node1,
    orion.node1.publicKey,
    besu.node1.privateKey,
    greeterContractAddress,
    privacyGroupCreationResult.privacyGroupId,
    "fire",
    null
  ).then(r => {
    return r;
  });

  console.log(callFireEventFunctionResult);
};

if (require.main === module) {
  module.exports();
}
