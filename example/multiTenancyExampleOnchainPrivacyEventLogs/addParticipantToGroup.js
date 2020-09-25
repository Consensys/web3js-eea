const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const EEAClient = require("../../src");

const { besu, orion } = require("../keys");
const { createHttpProvider } = require("../helpers.js");

const node = new EEAClient(
  new Web3(createHttpProvider(orion.node1.jwt, besu.node1.url)),
  2018
);
const params = JSON.parse(fs.readFileSync(path.join(__dirname, "params.json")));

async function run() {
  const { privacyGroupId } = params;

  const addResult = await node.privx.addToPrivacyGroup({
    participants: [orion.node11.publicKey],
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privacyGroupId,
    privateKey: besu.node1.privateKey
  });

  console.log("Added new node to privacy group:");
  console.log(addResult);
}

run();
