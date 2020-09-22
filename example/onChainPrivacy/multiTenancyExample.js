const Web3 = require("web3");
const EEAClient = require("../../src");

const Utils = require("./helpers.js");
const { orion, besu } = require("../keys.js");

// TODO read this from a file
// this is orion10-jwt
const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJtaXNzaW9ucyI6WyIqOioiXSwicHJpdmFjeVB1YmxpY0tleSI6IkdHaWxFa1hMYVE5eWhodGJwQlQwM01lOWlZYTdVL21XWHhySmhuYmwxWFk9IiwiZXhwIjoxNjAwODk5OTk5MDAyfQ.pSMwiHSnVu3C1r8eH6OFnJIqWM4HG8n9OWbMHh0Qlw8j3k4RYp2BDBQjyS_qjSL2b2bSaHsEJ3y8EeTQK7Watitc3qs_KdS0If6z2Sn7-jGJjtqePAvl32zYtGRzFkbwI1DZGIkYfjjkc__1pKCwhJ_rQ9ggFuoh8AYzpz3F7aAGUFh9NMWl8WmT1bBjfyMgb7yUUV97UbfUOgI4CChrje0vWT5jGNyAweaNYrtHPxfXECySs99cMoqLBcsg6_ypUcrCXuONBZlI2e0bDLwpwrpfZj7YWLsxtPf2AxVN4JMGBwuuy5Rl4J3IHynm3JjgezPVS4UXKvUggb17XOGf5Q";

const httpProviderWithJwt = new Web3.providers.HttpProvider(besu.node1.url, {
  headers: [
    {
      name: "Authorization",
      value: `Bearer ${token}`
    }
  ]
});

const node1 = new EEAClient(new Web3(httpProviderWithJwt), 2018);

module.exports = async () => {
  const onChainPrivacyGroupCreationResult = await node1.privx.createPrivacyGroup(
    {
      participants: [orion.node1.publicKey, orion.node12.publicKey],
      enclaveKey: orion.node1.publicKey,
      privateFrom: orion.node1.publicKey,
      privateKey: besu.node1.privateKey
    }
  );
  console.log("CREATION RESULT");
  console.log(onChainPrivacyGroupCreationResult);

  await node1.priv.getTransactionReceipt(
    onChainPrivacyGroupCreationResult.commitmentHash,
    orion.node12.publicKey
  );

  const findResult = await node1.privx.findOnChainPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node12.publicKey]
  });
  Utils.logMatchingGroup(
    findResult,
    onChainPrivacyGroupCreationResult.privacyGroupId
  );
  // TODO demonstrate that besu.node2 doesn't know about it
  // TODO demonstrate that orion.node13 doesn't know about it
};

if (require.main === module) {
  module.exports().catch(error => {
    console.log(error);
    console.log(
      "\nThis example requires ONCHAIN privacy to be ENABLED. \nCheck config for ONCHAIN privacy groups."
    );
  });
}
