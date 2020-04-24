const test = require("tape");

const Web3 = require("web3");
const EEAClient = require("../../src");

const { contracts, parseError } = require("./support/helpers");
const { besu, orion } = require("./support/keys");

test("getPrivateTransaction", async t => {
  const chainID = 2018;
  const node1Client = new EEAClient(new Web3(besu.node1.url), chainID);
  const node2Client = new EEAClient(new Web3(besu.node2.url), chainID);
  const node3Client = new EEAClient(new Web3(besu.node3.url), chainID);

  // create a privacy group with nodes 1 and 2
  const privacyGroupId = await node1Client.priv.createPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node2.publicKey]
  });

  // deploy a contract and get the receipt
  const receipt = await node1Client.eea
    .sendRawTransaction({
      data: `0x${contracts.eventEmitter.bytecode}`,
      privateFrom: orion.node1.publicKey,
      privacyGroupId,
      privateKey: besu.node1.privateKey
    })
    .then(hash => {
      return node1Client.priv.getTransactionReceipt(
        hash,
        orion.node1.publicKey
      );
    });
  const { commitmentHash: publicHash } = receipt;

  // group membership
  t.test("should get tx from originating node", async st => {
    st.plan(2);

    const result = await node1Client.priv.getTransaction(publicHash);

    st.strictEqual(result.privateFrom, orion.node1.publicKey, "matches sender");
    st.strictEqual(
      result.privacyGroupId,
      privacyGroupId,
      "matches privacy group ID"
    );

    st.end();
  });

  t.test("should get tx from other member node", async st => {
    st.plan(2);

    const result = await node2Client.priv.getTransaction(publicHash);

    st.strictEqual(result.privateFrom, orion.node1.publicKey, "matches sender");
    st.strictEqual(
      result.privacyGroupId,
      privacyGroupId,
      "matches privacy group ID"
    );

    st.end();
  });

  t.test("should get error from non-member node", async st => {
    st.plan(1);

    const result = await node3Client.priv.getTransaction(publicHash);
    st.strictEqual(result, null, "null result");

    st.end();
  });

  // inputs
  t.test("should fail if the transaction hash is invalid", async st => {
    st.plan(1);

    try {
      await node1Client.priv.getTransaction(undefined);
      st.fail("Invalid txHash should have thrown");
    } catch (error) {
      const e = parseError(error);
      st.strictEqual(e.message, "Invalid params");
    }

    st.end();
  });

  t.test("should return null if the txHash does not exist", async st => {
    st.plan(1);

    const invalidHash =
      "0x0000000000000000000000000000000000000000000000000000000000000000";

    const result = await node3Client.priv.getTransaction(invalidHash);
    st.strictEqual(
      result,
      null,
      "Hash for non-existent transaction should return null"
    );

    st.end();
  });

  t.end();
});
