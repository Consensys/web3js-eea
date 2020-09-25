const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const EEAClient = require("../../src");

const { besu, orion } = require("../keys");
const { logMatchingGroup, createHttpProvider } = require("../helpers.js");

const node = new EEAClient(
  new Web3(createHttpProvider(orion.node1.jwt, besu.node1.url)),
  2018
);
const params = JSON.parse(fs.readFileSync(path.join(__dirname, "params.json")));

async function run() {
  const { privacyGroupId } = params;
  const addressToRemove = orion.node11.publicKey;

  const findResultWithAddedNode = await node.privx.findOnChainPrivacyGroup({
    addresses: [
      orion.node1.publicKey,
      orion.node2.publicKey,
      orion.node11.publicKey
    ]
  });
  console.log("Found privacy groups with added node:");
  logMatchingGroup(findResultWithAddedNode, privacyGroupId);

  const removeResult = await node.privx.removeFromPrivacyGroup({
    participant: addressToRemove,
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privacyGroupId,
    privateKey: besu.node1.privateKey
  });
  console.log(removeResult);
  console.log(
    `Removed third participant ${addressToRemove} from privacy group ${privacyGroupId}`
  );

  const findResultWithRemovedNode = await node.privx.findOnChainPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  });
  console.log("Found privacy groups with removed node:");
  logMatchingGroup(findResultWithRemovedNode, privacyGroupId);
}

run();
