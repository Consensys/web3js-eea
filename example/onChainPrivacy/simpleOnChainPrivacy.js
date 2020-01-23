const crypto = require("crypto");
const Web3 = require("web3");
const EEAClient = require("../../src");

const { orion, besu } = require("../keys.js");

const node1 = new EEAClient(new Web3(besu.node1.url), 2018);
const node2 = new EEAClient(new Web3(besu.node2.url), 2018);

module.exports = async () => {
  const creationResult = await node1.privx.addToPrivacyGroup({
    participants: [orion.node1.publicKey, orion.node2.publicKey],
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privacyGroupId: crypto.randomBytes(32).toString("base64"),
    privateKey: besu.node1.privateKey
  });
  console.log(creationResult);

  const node2Receipt = await node2.priv.getTransactionReceipt(
    creationResult.commitmentHash,
    orion.node2.publicKey
  );
  console.log(node2Receipt);
};

if (require.main === module) {
  module.exports();
}
