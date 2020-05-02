const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const EEAClient = require("../../src");

const { besu } = require("../keys");

const node = new EEAClient(new Web3(besu.node1.url), 2018);
const params = JSON.parse(fs.readFileSync(path.join(__dirname, "params.json")));

async function unsubscribe(subscription) {
  console.log("unsubscribing", subscription.filterId);
  await subscription
    .unsubscribe((error, success) => {
      if (!error) {
        if (success) {
          console.log("unsubscribed!");
        } else {
          console.log("failed to unsubscribe");
        }
      }
    })
    .catch(console.error);

  process.exit(0);
}

async function run() {
  const { privacyGroupId, contractAddress: address } = params;
  console.log(params);

  const filter = {
    address,
    fromBlock: 1
  };

  // Create subscription
  return node.priv
    .subscribe(privacyGroupId, filter, (error, result) => {
      if (!error) {
        console.log("installed filter", result);
      } else {
        console.error("Problem installing filter", error);
        throw error;
      }
    })
    .then(subscription => {
      // Add handler for each log received
      subscription.on("data", log => {
        console.log("LOG =>", log);
      });

      // Unsubscribe on interrupt
      process.on("SIGINT", () => {
        unsubscribe(subscription);
      });

      return subscription;
    });
}

run();
