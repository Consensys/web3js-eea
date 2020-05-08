const test = require("tape");

const Web3 = require("web3");
const EEAClient = require("../../src");

const { contracts, ContractFactory } = require("./support/helpers");
const { besu, orion } = require("./support/keys");

test("getLogs", async t => {
  const chainID = 2018;
  const node1Client = new EEAClient(new Web3(besu.node1.url), chainID);
  const node2Client = new EEAClient(new Web3(besu.node2.url), chainID);
  const node3Client = new EEAClient(new Web3(besu.node3.url), chainID);

  // create privacy group
  const privacyGroupId = await node1Client.priv.createPrivacyGroup({
    addresses: [orion.node1.publicKey, orion.node2.publicKey],
    name: "",
    description: "Nodes 1 and 2"
  });

  // deploy contract
  const factory = new ContractFactory(
    contracts.eventEmitter.bytecode,
    contracts.eventEmitter.abi
  );

  factory.connect(
    node1Client,
    { enclaveKey: orion.node1.publicKey, privacyGroupId },
    besu.node1.privateKey
  );

  const contract = await factory.privateDeploy(privacyGroupId);
  const { deployReceipt } = contract;
  const contract1Address = deployReceipt.contractAddress;
  console.log(deployReceipt);

  // send some transactions from member 1
  await contract.send("store", [1]);
  const send2Receipt = await contract.send("store", [2]);

  // send some transactions from member 2
  factory.connect(
    node2Client,
    { enclaveKey: orion.node2.publicKey, privacyGroupId },
    besu.node2.privateKey
  );

  await contract.send("store", [3]);

  // deploy another contract
  factory.connect(
    node1Client,
    { enclaveKey: orion.node1.publicKey, privacyGroupId },
    besu.node1.privateKey
  );
  const contract2 = await factory.privateDeploy(privacyGroupId);
  const { deployReceipt: deployReceipt2 } = contract2;
  const contract2Address = deployReceipt2.contractAddress;
  console.log(deployReceipt2);

  // send a transaction to the second contract
  const send4Receipt = await contract2.send("store", [4]);

  t.test("accessibility", async st => {
    const logCount = 4;
    st.test("creator should get logs", async sst => {
      const logs = await node1Client.priv.getPastLogs(privacyGroupId, {});
      sst.strictEqual(logs.length, logCount, "sees all logs");
      sst.end();
    });

    st.test("member should get logs", async sst => {
      const logs = await node2Client.priv.getPastLogs(privacyGroupId, {});
      sst.strictEqual(logs.length, logCount, "sees all logs");
      sst.end();
    });

    st.test("non-member should not get logs", async sst => {
      const logs = await node3Client.priv.getPastLogs(privacyGroupId, {});
      sst.strictEqual(logs.length, 0, "sees no logs");
      sst.end();
    });
    st.end();
  });

  t.test("filters", async st => {
    st.test("should get logs by address", async sst => {
      const logs1 = await node1Client.priv.getPastLogs(privacyGroupId, {
        address: contract1Address
      });
      sst.strictEqual(logs1.length, 3, "sees logs from contract 1");

      const logs2 = await node1Client.priv.getPastLogs(privacyGroupId, {
        address: contract2Address
      });
      sst.strictEqual(logs2.length, 1, "sees logs from contract 2");

      sst.end();
    });

    st.test("should get logs to a given block number", async sst => {
      const logs1 = await node1Client.priv.getPastLogs(privacyGroupId, {
        toBlock: deployReceipt.blockNumber
      });
      sst.strictEqual(logs1.length, 0, "sees logs to deploy tx");

      const logs2 = await node1Client.priv.getPastLogs(privacyGroupId, {
        toBlock: send2Receipt.blockNumber
      });
      sst.strictEqual(logs2.length, 2, "sees logs to send tx 2");

      const logs4 = await node1Client.priv.getPastLogs(privacyGroupId, {
        toBlock: send4Receipt.blockNumber
      });
      sst.strictEqual(logs4.length, 4, "sees logs to send tx 4");

      sst.end();
    });

    st.test("should get logs from a given block number", async sst => {
      const logs1 = await node1Client.priv.getPastLogs(privacyGroupId, {
        fromBlock: deployReceipt.blockNumber
      });
      sst.strictEqual(logs1.length, 4, "sees all logs from deploy tx");

      // skip 1
      const logs2 = await node1Client.priv.getPastLogs(privacyGroupId, {
        fromBlock: send2Receipt.blockNumber
      });
      sst.strictEqual(logs2.length, 3, "sees logs from send tx 2");

      // skip 3
      const logs4 = await node1Client.priv.getPastLogs(privacyGroupId, {
        fromBlock: send4Receipt.blockNumber
      });
      sst.strictEqual(logs4.length, 1, "sees logs from send tx 4");

      sst.end();
    });

    st.test("should get logs by topic", async sst => {
      // eslint-disable-next-line no-underscore-dangle
      factory.contract._address = contract1Address;
      const filter = factory.contract.events.stored({});
      const { topics } = filter.arguments[0];

      const logs1 = await node1Client.priv.getPastLogs(privacyGroupId, {
        topics
      });
      sst.strictEqual(logs1.length, 4, "sees logs with topic");

      sst.end();
    });

    st.end();
  });

  t.end();
});
