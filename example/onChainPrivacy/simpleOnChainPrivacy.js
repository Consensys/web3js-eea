const Web3 = require("web3");
const EEAClient = require("../../src");

const { orion, besu } = require("../keys.js");

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);
const web3Node2 = new EEAClient(new Web3(besu.node2.url), 2018);

module.exports = async () => {
  const result = await web3.privx.createXPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node2.publicKey],
    name: "Group Name",
    description: "Group Description"
  });
  console.log(result);

  const receiptFromNode2 = await web3Node2.priv.getTransactionReceipt(
    result.logs[0].transactionHash,
    ""
  );
  console.log(receiptFromNode2);

  /* todo: make some transactions, add a node, make some transactions, remove it, make some transactions
   *  however, add & remove are not yet implemented */
};

if (require.main === module) {
  module.exports();
}
