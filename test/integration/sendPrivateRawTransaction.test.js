const test = require("tape");

const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const createGroup = require("../../example/privacyGroupManagement/createPrivacyGroup");
const findGroup = require("../../example/privacyGroupManagement/findPrivacyGroup");
const deleteGroup = require("../../example/privacyGroupManagement/deletePrivacyGroup");

const EEAClient = require("../../src/");
const EventEmitterAbi = require("../../example/solidity/EventEmitter/EventEmitter.json")
  .output.abi;
const { orion, pantheon } = require("../../example/keys.js");

test("[MultiNodeExample]: Can manage privacy groups", t => {
  t.test("can create, find and delete privacy group", async st => {
    const createdGroupId = await createGroup.createPrivacyGroup();

    let returnedPrivacyGroup = await findGroup.findPrivacyGroup();

    const listWithPrivacyGroup = returnedPrivacyGroup.filter(i => {
      return i.privacyGroupId === createdGroupId;
    });

    const binary = fs.readFileSync(
      path.join(
        __dirname,
        "../../example/solidity/EventEmitter/EventEmitter.bin"
      )
    );

    const web3 = new EEAClient(new Web3(pantheon.node1.url), 2018);
    web3.eth.Contract(EventEmitterAbi);

    const createPrivateEmitterContract = () => {
      const contractOptions = {
        data: `0x${binary}`,
        privateFrom: orion.node1.publicKey,
        privacyGroupId: listWithPrivacyGroup[0].privacyGroupId,
        privateKey: pantheon.node1.privateKey
      };
      return web3.eea.sendRawTransaction(contractOptions);
    };

    const result = await createPrivateEmitterContract();

    const deletedGroup = await deleteGroup.deletePrivacyGroup(createdGroupId);

    returnedPrivacyGroup = await findGroup.findPrivacyGroup();

    const listWithPrivacyGroupAfterDelete = returnedPrivacyGroup.filter(i => {
      return i.privacyGroupId === deletedGroup;
    });

    st.equal(listWithPrivacyGroupAfterDelete.length, 0);

    st.end();
  });
});
