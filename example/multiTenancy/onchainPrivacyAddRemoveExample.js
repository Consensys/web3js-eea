const Web3 = require("web3");
const EEAClient = require("../../src");

const { orion, besu } = require("../keys.js");
const { logMatchingGroup, createHttpProvider } = require("../helpers.js");

const node1 = new EEAClient(
  new Web3(createHttpProvider(orion.node1.jwt, besu.node1.url)),
  2018
);
const node2 = new EEAClient(
  new Web3(createHttpProvider(orion.node2.jwt, besu.node2.url)),
  2018
);
// in this example node3 is a second tenant on besu/orion node1 with orion key orion11
const node3 = new EEAClient(
  new Web3(createHttpProvider(orion.node11.jwt, besu.node1.url)),
  2018
);

module.exports = async () => {
  const onChainPrivacyGroupCreationResult = await node1.privx.createPrivacyGroup(
    {
      participants: [orion.node1.publicKey, orion.node2.publicKey],
      enclaveKey: orion.node1.publicKey,
      privateFrom: orion.node1.publicKey,
      privateKey: besu.node1.privateKey
    }
  );
  console.log("Created new on-chain privacy group:");
  console.log(onChainPrivacyGroupCreationResult);

  const findResult = await node2.privx.findOnChainPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  });
  console.log("Found privacy group results:");
  logMatchingGroup(
    findResult,
    onChainPrivacyGroupCreationResult.privacyGroupId
  );

  const addResult = await node1.privx.addToPrivacyGroup({
    participants: [orion.node11.publicKey],
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privacyGroupId: onChainPrivacyGroupCreationResult.privacyGroupId,
    privateKey: besu.node1.privateKey
  });
  console.log("Added new node to privacy group:");
  console.log(addResult);

  const receiptFromNode3 = await node3.priv.getTransactionReceipt(
    addResult.commitmentHash,
    orion.node11.publicKey
  );
  console.log("Got transaction receipt from added node:");
  console.log(receiptFromNode3);

  const findResultWithAddedNode = await node2.privx.findOnChainPrivacyGroup({
    addresses: [
      orion.node1.publicKey,
      orion.node2.publicKey,
      orion.node11.publicKey
    ]
  });
  console.log("Found privacy groups with added node:");
  logMatchingGroup(
    findResultWithAddedNode,
    onChainPrivacyGroupCreationResult.privacyGroupId
  );

  const removeResult = await node1.privx.removeFromPrivacyGroup({
    participant: orion.node11.publicKey,
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privacyGroupId: onChainPrivacyGroupCreationResult.privacyGroupId,
    privateKey: besu.node1.privateKey
  });
  console.log("Removed third participant from privacy group:");
  console.log(removeResult);

  const findResultRemovedNode = await node2.privx.findOnChainPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  });
  logMatchingGroup(
    findResultRemovedNode,
    onChainPrivacyGroupCreationResult.privacyGroupId
  );
};

if (require.main === module) {
  module.exports();
}
