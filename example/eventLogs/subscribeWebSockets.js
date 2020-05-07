const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const EEAClient = require("../../src");

const { besu } = require("../keys");

const node = new EEAClient(new Web3(besu.node1.wsUrl), 2018);
const params = JSON.parse(fs.readFileSync(path.join(__dirname, "params.json")));

async function run() {
  const { privacyGroupId, contractAddress: address } = params;

  const filter = {
    address
    // fromBlock: 1
  };

  console.log("Installing filter", filter);

  // Create subscription
  return node.priv
    .subscribe(privacyGroupId, filter, (error, result) => {
      if (!error) {
        console.log("Installed filter", result);
      } else {
        console.error("Problem installing filter:", error);
        throw error;
      }
    })
    .then(async subscription => {
      // Add handlers for incoming events
      subscription
        .on("data", log => {
          console.log("LOG =>", log.params);
        })
        .on("error", console.error);

      // Unsubscribe and disconnect on interrupt
      process.on("SIGINT", async () => {
        console.log("unsubscribing");
        await subscription.unsubscribe((error, success) => {
          if (!error) {
            console.log("Unsubscribed:", success);
          } else {
            console.error("Failed to unsubscribe:", error);
          }

          node.currentProvider.disconnect();
        });
      });

      return subscription;
    })
    .catch(error => {
      console.error(error);
    });
}

run();
