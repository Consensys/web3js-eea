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
const authTokenOrion12 =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJtaXNzaW9ucyI6WyIqOioiXSwicHJpdmFjeVB1YmxpY0tleSI6ImR5S3htTzVKaTdkOGFaVFh2azAyeDk4bDZvQjlRNE1CVHE2VzR0SVcrQU09IiwiZXhwIjoxNjAwODk5OTk5MDAyfQ.psocMuOFSIIpiU6xFFLAvENGLDaTGc9nvGKQRz2OizT_sVZZowcewDWdOK5ZPDvaLSbweLNlnrDEycmNhLB0coGDf-gqK7pgeN_rMn4vMPFyBaeV3DoPnQzNl9JYrldPRzEv70Z6MInKy4mYm649Owow9K_MNuHTUjPdUZOypUVVRBae94B6PgQFrrWZnwZ3wjfZyc-e8cF8s_Ao067xjkoomBA-asYnPuMwTsyjdykypNx2Y0_cdjc8t-F1n2xWLqEvbx8QmrMNk9_2o9fURCSMd4QDq6dqswQOveTTTw2FbhicH9_dSmg_J64lFoLkg7BEDJ5yUIeZ2rF6ytv-wQ";

const node1 = new EEAClient(
  new Web3(createHttpProvider(authTokenOrion10, besu.node1.url)),
  2018
);
const node2 = new EEAClient(
  new Web3(createHttpProvider(authTokenOrion20, besu.node2.url)),
  2018
);
// in this example node3 is a second tenant on besu/orion node1 with orion key orion12
const node3 = new EEAClient(
  new Web3(createHttpProvider(authTokenOrion12, besu.node1.url)),
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
  console.log("Created new on-chain privacy group:");
  console.log(onChainPrivacyGroupCreationResult);

  const findResult = await node2.privx.findOnChainPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  });
  console.log("Found privacy group results:");
  Utils.logMatchingGroup(
    findResult,
    onChainPrivacyGroupCreationResult.privacyGroupId
  );

  const addResult = await node1.privx.addToPrivacyGroup({
    participants: [orion.node12.publicKey],
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privacyGroupId: onChainPrivacyGroupCreationResult.privacyGroupId,
    privateKey: besu.node1.privateKey
  });
  console.log("Added new node to privacy group:");
  console.log(addResult);

  const receiptFromNode3 = await node3.priv.getTransactionReceipt(
    addResult.commitmentHash,
    orion.node12.publicKey
  );
  console.log("Got transaction receipt from added node:");
  console.log(receiptFromNode3);

  const findResultWithAddedNode = await node2.privx.findOnChainPrivacyGroup({
    addresses: [
      orion.node1.publicKey,
      orion.node2.publicKey,
      orion.node12.publicKey
    ]
  });
  console.log("Found privacy groups with added node:");
  Utils.logMatchingGroup(
    findResultWithAddedNode,
    onChainPrivacyGroupCreationResult.privacyGroupId
  );

  const removeResult = await node1.privx.removeFromPrivacyGroup({
    participant: orion.node12.publicKey,
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privacyGroupId: onChainPrivacyGroupCreationResult.privacyGroupId,
    privateKey: besu.node1.privateKey
  });
  console.log("Removed third participant from privacy group:");
  console.log(removeResult);

  const findResultRemovedNode = await node2.privx.findOnChainPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  });
  Utils.logMatchingGroup(
    findResultRemovedNode,
    onChainPrivacyGroupCreationResult.privacyGroupId
  );
};

if (require.main === module) {
  module.exports();
}
