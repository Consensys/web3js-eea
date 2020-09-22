const Web3 = require("web3");
const EEAClient = require("../../src");

const Utils = require("./helpers.js");
const { orion, besu } = require("../keys.js");
const { createHttpProvider } = require("./helpers.js");

// TODO read JWTs from file
const authTokenOrion10 =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJtaXNzaW9ucyI6WyIqOioiXSwicHJpdmFjeVB1YmxpY0tleSI6IkdHaWxFa1hMYVE5eWhodGJwQlQwM01lOWlZYTdVL21XWHhySmhuYmwxWFk9IiwiZXhwIjoxNjAwODk5OTk5MDAyfQ.pSMwiHSnVu3C1r8eH6OFnJIqWM4HG8n9OWbMHh0Qlw8j3k4RYp2BDBQjyS_qjSL2b2bSaHsEJ3y8EeTQK7Watitc3qs_KdS0If6z2Sn7-jGJjtqePAvl32zYtGRzFkbwI1DZGIkYfjjkc__1pKCwhJ_rQ9ggFuoh8AYzpz3F7aAGUFh9NMWl8WmT1bBjfyMgb7yUUV97UbfUOgI4CChrje0vWT5jGNyAweaNYrtHPxfXECySs99cMoqLBcsg6_ypUcrCXuONBZlI2e0bDLwpwrpfZj7YWLsxtPf2AxVN4JMGBwuuy5Rl4J3IHynm3JjgezPVS4UXKvUggb17XOGf5Q";
const authTokenOrion20 =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJtaXNzaW9ucyI6WyIqOioiXSwicHJpdmFjeVB1YmxpY0tleSI6IktrT2pOTG1DSTZyK21JQ3JDNmwrWHVFRGpGRXpRbGxhTVFNcFdMbDR5MXM9IiwiZXhwIjoxNjAwODk5OTk5MDAyfQ.XAUNQNuEnfmmoM0um-ikxe_aJv4vGALeD-dNy4_7pPDtPGrP5LmUZP6zcsm2KCmu9g2RhovxrCMAYDTCbSOV1T7sG7RBenNdw8AxD0kpRsz9IMzfpcaup4DIfm2aWnAnDsuND5wV9PRLLoomQqq_eEiI5s6fBi0aupYGE1wUB-mSwE6enaZD5Tkz_lTb_W4Gq-Z3lM57E-hwThUw_3RszL3HV-rl0n_hxZG0LQFEKmRnfbjPkt6Qm8RsyQ26O7K6AFbmEdv4N-1MQlzZWUACeb4JTOzEvlrz8E-Kdo1pkCrtr44veReN6Gmt0Cmv8Tv_1BKfggaKFinfaGUJJJFg_Q";

const node1 = new EEAClient(
  new Web3(createHttpProvider(authTokenOrion10, besu.node1.url)),
  2018
);
const node2 = new EEAClient(
  new Web3(createHttpProvider(authTokenOrion20, besu.node2.url)),
  2018
);

module.exports = async () => {
  const onChainPrivacyGroupCreationResult = await node1.privx.createPrivacyGroup(
    {
      participants: [orion.node1.publicKey, orion.node2.publicKey],
      enclaveKey: orion.node1.publicKey,
      privateFrom: orion.node1.publicKey,
      privateKey: besu.node1.privateKey
    }
  );
  console.log("CREATION RESULT");
  console.log(onChainPrivacyGroupCreationResult);

  await node1.priv.getTransactionReceipt(
    onChainPrivacyGroupCreationResult.commitmentHash,
    orion.node1.publicKey
  );

  const findResult1 = await node1.privx.findOnChainPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  });
  console.log("finding groups on node1");
  Utils.logMatchingGroup(
    findResult1,
    onChainPrivacyGroupCreationResult.privacyGroupId
  );

  const findResult2 = await node2.privx.findOnChainPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  });
  console.log("finding groups on node2");
  Utils.logMatchingGroup(
    findResult2,
    onChainPrivacyGroupCreationResult.privacyGroupId
  );
  // TODO demonstrate that besu.node2 doesn't know about it
};

if (require.main === module) {
  module.exports().catch(error => {
    console.log(error);
    console.log(
      "\nThis example requires ONCHAIN privacy (and JWT Auth) to be ENABLED. \nCheck Besu config."
    );
  });
}
