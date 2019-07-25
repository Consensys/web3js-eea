const test = require("tape");

const deployContract = require("../../example/multiNodeExamplePrivacyGroup/deployContract");
const node1Example = require("../../example/multiNodeExamplePrivacyGroup/storeValueFromNode1");
const node2Example = require("../../example/multiNodeExamplePrivacyGroup/storeValueFromNode2");

test("[MultiNodeExample]: Can run quickstart with privacyGroupId instead of privateFor", t => {
  let contractAddress;
  let privacyGroupId;
  t.test("deploy contract", async st => {
    const response = await deployContract();
    ({ contractAddress, privacyGroupId } = response);
    st.end();
  });

  t.test("store and gets from node 1", async st => {
    const result = await node1Example.storeValueFromNode1(
      contractAddress,
      1000,
      privacyGroupId
    );

    st.equal(
      result.logs[0].data,
      "0x000000000000000000000000fe3b557e8fb62b89f4916b721be55ceb828dbd7300000000000000000000000000000000000000000000000000000000000003e8"
    );

    const getNode1 = await node1Example.getValueFromNode1(
      contractAddress,
      privacyGroupId
    );

    st.equal(
      getNode1.output,
      "0x00000000000000000000000000000000000000000000000000000000000003e8"
    );

    const getNode2 = await node1Example.getValueFromNode2(
      contractAddress,
      privacyGroupId
    );

    st.equal(
      getNode2.output,
      "0x00000000000000000000000000000000000000000000000000000000000003e8"
    );

    st.end();
  });

  t.test("store and gets from node 2", async st => {
    const result = await node2Example.storeValueFromNode2(
      contractAddress,
      42,
      privacyGroupId
    );

    st.equal(
      result.logs[0].data,
      "0x000000000000000000000000627306090abab3a6e1400e9345bc60c78a8bef57000000000000000000000000000000000000000000000000000000000000002a"
    );

    const getNode1 = await node2Example.getValueFromNode1(
      contractAddress,
      privacyGroupId
    );

    st.equal(
      getNode1.output,
      "0x000000000000000000000000000000000000000000000000000000000000002a"
    );

    const getNode2 = await node2Example.getValueFromNode2(
      contractAddress,
      privacyGroupId
    );

    st.equal(
      getNode2.output,
      "0x000000000000000000000000000000000000000000000000000000000000002a"
    );

    st.end();
  });
});
