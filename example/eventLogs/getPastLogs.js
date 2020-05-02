const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const EEAClient = require("../../src");

const { besu } = require("../keys");

const node = new EEAClient(new Web3(besu.node1.url), 2018);
const params = JSON.parse(fs.readFileSync(path.join(__dirname, "params.json")));

function run() {
  const { privacyGroupId, contractAddress: address } = params;

  const filter = {
    address
  };

  return node.priv.getPastLogs(privacyGroupId, filter).then(logs => {
    console.log("Received logs\n", logs);
    return logs;
  });
}

run();
