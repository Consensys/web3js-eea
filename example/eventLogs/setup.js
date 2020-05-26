const Web3 = require("web3");
const fs = require("fs");
const path = require("path");
const EEAClient = require("../../src");

const { besu, orion } = require("../keys");

const bytecode = fs.readFileSync(
  path.join(__dirname, "../solidity/EventEmitter/EventEmitter.bin")
);

const provider = new Web3.providers.HttpProvider(besu.node1.url);
const node = new EEAClient(new Web3(provider), 2018);

async function run() {
  const enclaveKey = orion.node1.publicKey;
  const addresses = [orion.node1.publicKey, orion.node2.publicKey];

  // create privacy group
  const privacyGroupId = await node.priv.createPrivacyGroup({ addresses });
  console.log("Created privacy group", privacyGroupId);

  // deploy contract
  const deployReceipt = await node.eea
    .sendRawTransaction({
      data: `0x${bytecode}`,
      privateFrom: enclaveKey,
      privacyGroupId,
      privateKey: besu.node1.privateKey
    })
    .then(hash => {
      return node.priv.getTransactionReceipt(hash, enclaveKey);
    });

  const { contractAddress, blockNumber } = deployReceipt;
  console.log("deployed", contractAddress);

  // save to file
  const params = {
    privacyGroupId,
    contractAddress,
    blockNumber
  };

  fs.writeFileSync(path.join(__dirname, "params.json"), JSON.stringify(params));

  console.log(params);
}

run();
