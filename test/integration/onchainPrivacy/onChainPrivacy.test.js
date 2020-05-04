const crypto = require("crypto");
const test = require("tape");
const Web3 = require("web3");

const EEAClient = require("../../../src");

const { besu, orion } = require("../support/keys");
const { contracts } = require("../support/helpers");

test("On chain privacy", async t => {
  const chainID = 2018;

  const node1Client = new EEAClient(new Web3(besu.node1.url), chainID);
  const node2Client = new EEAClient(new Web3(besu.node2.url), chainID);
  const node3Client = new EEAClient(new Web3(besu.node3.url), chainID);

  const privacyContractAddress = contracts.privacyInterface.address;

  let privacyGroupId;
  const participants = [orion.node1.publicKey];

  const privacyOptions = {
    enclaveKey: orion.node1.publicKey,
    privacyGroupId: undefined, // set later
    privateKey: besu.node1.privateKey
  };

  // createPrivacyGroup
  t.test("should create privacy group", async st => {
    const receipt = await node1Client.privx.createPrivacyGroup({
      participants,
      enclaveKey: orion.node1.publicKey,
      privateKey: besu.node1.privateKey
    });

    ({ privacyGroupId } = receipt);
    // assign privacy group ID for later use
    privacyOptions.privacyGroupId = privacyGroupId;

    st.strictEqual(
      receipt.privateFrom,
      orion.node1.publicKey,
      "sender matches"
    );
    st.strictEqual(receipt.status, "0x1", "status is successful");
    st.strictEqual(
      receipt.logs.length,
      participants.length,
      "emits ParticipantAdded for each participant"
    );
    st.isNotEqual(receipt.privacyGroupId, null, "has privacy group");
    st.strictEqual(receipt.to, privacyContractAddress, "to privacy contract");

    st.end();
  });

  t.test(
    "should create privacy group with a specified privacyGroupId",
    async st => {
      // Generate a privacyGroupId
      const id = crypto.randomBytes(32).toString("base64");

      const receipt = await node1Client.privx.createPrivacyGroup({
        participants,
        ...privacyOptions,
        privacyGroupId: id
      });

      st.strictEqual(
        receipt.privateFrom,
        orion.node1.publicKey,
        "sender matches"
      );
      st.strictEqual(receipt.status, "0x1", "status is successful");
      st.strictEqual(
        receipt.logs.length,
        participants.length,
        "emits ParticipantAdded for each participant"
      );
      st.strictEqual(receipt.privacyGroupId, id, "privacy group ID matches");
      st.strictEqual(receipt.to, privacyContractAddress, "to privacy contract");

      st.end();
    }
  );

  // findOnChainPrivacyGroup
  t.test("should find privacy group after creation", async st => {
    const found = await node1Client.privx.findOnChainPrivacyGroup({
      addresses: participants
    });

    // the one we created should be in there
    const created = found.find(group => {
      return group.privacyGroupId === privacyGroupId;
    });

    st.strictEqual(
      created.privacyGroupId,
      privacyGroupId,
      "matching privacy group ID"
    );
    st.deepEqual(created.members, participants.sort(), "has matching members");
    st.strictEqual(created.type, "ONCHAIN", "has correct type");
    st.strictEqual(created.name, "", "has empty name");
    st.strictEqual(created.description, "", "has empty description");

    st.end();
  });

  t.test("non-member should not find privacy group(s)", async st => {
    const found = await node2Client.privx.findOnChainPrivacyGroup({
      addresses: participants
    });
    st.strictEqual(found.length, 0, "finds no groups");

    st.end();
  });

  // addToPrivacyGroup
  t.test("should add a member to the group", async st => {
    // add node 2
    const addReceipt = await node1Client.privx.addToPrivacyGroup({
      ...privacyOptions,
      participants: [orion.node2.publicKey]
    });
    st.strictEqual(addReceipt.status, "0x1", "successful tx");

    st.end();
  });

  t.test("non-member should not be able to add to the group", async st => {
    try {
      await node3Client.privx.addToPrivacyGroup({
        enclaveKey: orion.node3.publicKey,
        privateKey: besu.node3.privateKey,
        privacyGroupId
      });

      st.fail("Non-member added to group");
    } catch (error) {
      st.pass("Non-member failed to add to group");
    }
    st.end();
  });

  // deploy contract
  let contract;
  let contractAddress;
  t.test("interaction with contract", async st => {
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

    ({ contractAddress } = receipt);
    contract = new node1Client.eth.Contract(contracts.eventEmitter.abi);

    // Read
    const readValue = async node => {
      const raw = await node.priv.call({
        to: contractAddress,
        data: contract.methods.value().encodeABI(),
        privacyGroupId
      });

      return node.eth.abi.decodeParameter("uint256", raw);
    };

    st.test(
      "creating node should be able to read from the contract",
      async sst => {
        const value = await readValue(node1Client);
        sst.strictEqual(value, "0", "correct value");

        const rawSender = await node1Client.priv.call({
          to: contractAddress,
          data: contract.methods.sender().encodeABI(),
          privacyGroupId
        });
        const sender = node1Client.eth.abi.decodeParameter(
          "address",
          rawSender
        );
        sst.strictEqual(
          sender,
          "0x0000000000000000000000000000000000000000",
          "correct sender"
        );

        sst.end();
      }
    );

    st.test(
      "member node should be able to read from the contract",
      async sst => {
        const value = await readValue(node2Client);
        sst.strictEqual(value, "0", "correct value");
        sst.end();
      }
    );

    // NOTE: this is really a node that has never been a member
    st.test(
      "non-member node should NOT be able to read from the contract",
      async sst => {
        try {
          await readValue(node3Client);
          sst.fail("Non-member node was able to read from contract");
        } catch (error) {
          sst.pass("Non-member could not read");
        }

        sst.end();
      }
    );

    // Write
    const writeValue = async (node, enclaveKey, privateKey, value) => {
      return node.eea
        .sendRawTransaction({
          to: contractAddress,
          data: contract.methods.store([value]).encodeABI(),
          privateFrom: enclaveKey,
          privacyGroupId,
          privateKey
        })
        .then(transactionHash => {
          return node.priv.getTransactionReceipt(transactionHash, enclaveKey);
        });
    };

    st.test(
      "creating node should be able to write to the contract",
      async sst => {
        const result = await writeValue(
          node1Client,
          orion.node1.publicKey,
          besu.node1.privateKey,
          1
        );

        sst.strictEqual(result.status, "0x1", "successful tx");
        sst.end();
      }
    );

    st.test(
      "member node should be able to write to the contract",
      async sst => {
        const result = await writeValue(
          node2Client,
          orion.node2.publicKey,
          besu.node2.privateKey,
          2
        );

        sst.strictEqual(result.status, "0x1", "successful tx");
        sst.end();
      }
    );

    st.test(
      "non-member node should NOT be able to write to the contract",
      async sst => {
        try {
          await writeValue(
            node3Client,
            orion.node3.publicKey,
            besu.node3.privateKey,
            3
          );
          sst.fail("Non-member node was able to write to the contract");
        } catch (error) {
          sst.pass("Non-member could not write");
        }

        sst.end();
      }
    );
    st.end();
  });

  // Remove
  t.test("removeFromPrivacyGroup", async st => {
    st.test("should remove a node from the privacy group", async sst => {
      const removeReceipt = await node1Client.privx.removeFromPrivacyGroup({
        ...privacyOptions,
        participant: orion.node2.publicKey
      });

      sst.strictEqual(removeReceipt.status, "0x1", "successful tx");
      sst.end();
    });

    st.test("removed node should not see contract updates", async sst => {
      // member node updates contract
      const newValue = 4;

      const updateReceipt = await node1Client.eea
        .sendRawTransaction({
          to: contractAddress,
          data: contract.methods.store([newValue]).encodeABI(),
          privateFrom: orion.node1.publicKey,
          privacyGroupId,
          privateKey: besu.node1.privateKey
        })
        .then(transactionHash => {
          return node1Client.priv.getTransactionReceipt(
            transactionHash,
            orion.node1.publicKey
          );
        });
      sst.strictEqual(updateReceipt.status, "0x1", "successful tx");

      // read from member
      const rawValue1 = await node1Client.priv.call({
        to: contractAddress,
        data: contract.methods.value().encodeABI(),
        privacyGroupId
      });
      const value1 = node1Client.eth.abi.decodeParameter("uint256", rawValue1);
      sst.strictEqual(value1, newValue.toString(), "sees current value");

      // read from removed node
      const rawValue = await node2Client.priv.call({
        to: contractAddress,
        data: contract.methods.value().encodeABI(),
        privacyGroupId
      });
      const value = node2Client.eth.abi.decodeParameter("uint256", rawValue);
      sst.strictEqual(value, "2", "sees old value");

      sst.end();
    });

    st.test("removed node should not find the privacy group", async sst => {
      const result = await node2Client.privx.findOnChainPrivacyGroup({
        addresses: [orion.node2.publicKey]
      });

      sst.strictEqual(result.length, 0, "no groups found");
      sst.end();
    });
    st.end();
  });

  t.end();
});
