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

module.exports = async () => {
  const onChainPrivacyGroupCreationResult = await node1.privx.createPrivacyGroup(
    {
      participants: [orion.node1.publicKey, orion.node2.publicKey],
      enclaveKey: orion.node1.publicKey,
      privateFrom: orion.node1.publicKey,
      privateKey: besu.node1.privateKey
    }
  );
  console.log("Creation result");
  console.log(onChainPrivacyGroupCreationResult);

  await node1.priv.getTransactionReceipt(
    onChainPrivacyGroupCreationResult.commitmentHash,
    orion.node1.publicKey
  );

  const findResult1 = await node1.privx.findOnChainPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  });
  console.log("finding groups on node1");
  logMatchingGroup(
    findResult1,
    onChainPrivacyGroupCreationResult.privacyGroupId
  );

  const findResult2 = await node2.privx.findOnChainPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  });
  console.log("finding groups on node2");
  logMatchingGroup(
    findResult2,
    onChainPrivacyGroupCreationResult.privacyGroupId
  );
};

if (require.main === module) {
  module.exports().catch(error => {
    console.log(error);
    console.log(
      "\nThis example requires ONCHAIN privacy (and JWT Auth) to be ENABLED. \nCheck Besu config."
    );
  });
}
