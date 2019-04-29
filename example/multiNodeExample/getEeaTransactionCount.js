const Web3 = require("web3");
const EEAClient = require("../../src");
const { orion, pantheon } = require("../keys.js");

const web3 = new EEAClient(new Web3(pantheon.node1.url), 2018);

return web3.eea
  .getTransactionCount({
    to: process.env.CONTRACT_ADDRESS,
    privateFrom: orion.node1.publicKey,
    privateFor: [orion.node2.publicKey]
  })
  .then(console.log);
