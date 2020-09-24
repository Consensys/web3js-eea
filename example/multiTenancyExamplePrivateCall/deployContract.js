const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const EEAClient = require("../../src");

const { orion, besu } = require("../keys.js");
const { createHttpProvider } = require("../helpers.js");

const binary = fs.readFileSync(
  path.join(__dirname, "../solidity/EventEmitter/EventEmitter.bin")
);

const node1 = new EEAClient(
  new Web3(createHttpProvider(orion.node1.jwt, besu.node1.url)),
  2018
);

const createEventEmitterContract = privacyGroupId => {
  const contractOptions = {
    data: `0x${binary}`,
    privateFrom: orion.node1.publicKey,
    privacyGroupId,
    privateKey: besu.node1.privateKey
  };
  return node1.eea.sendRawTransaction(contractOptions);
};

const getPrivateContractAddress = transactionHash => {
  return node1.priv
    .getTransactionReceipt(transactionHash, orion.node1.publicKey)
    .then(privateTransactionReceipt => {
      return privateTransactionReceipt.contractAddress;
    });
};

module.exports = async () => {
  const privacyGroupCreationResult = await node1.privx.createPrivacyGroup({
    participants: [orion.node1.publicKey, orion.node2.publicKey],
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privateKey: besu.node1.privateKey
  });

  console.log("Created privacy group");
  console.log(privacyGroupCreationResult);

  const contractAddress = await createEventEmitterContract(
    privacyGroupCreationResult.privacyGroupId
  ).then(res => {
    return getPrivateContractAddress(res);
  });
  console.log(
    `now you have to run:\n export CONTRACT_ADDRESS=${contractAddress}`
  );
  console.log(
    ` export PRIVACY_GROUP_ID=${privacyGroupCreationResult.privacyGroupId}`
  );
};

if (require.main === module) {
  module.exports();
}
