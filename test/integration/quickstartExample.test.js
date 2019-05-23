const test = require("tape");

const deployContract = require("../../example/multiNodeExample/deployContract");
const node1Example = require("../../example/multiNodeExample/storeValueFromNode1");
const node2Example = require("../../example/multiNodeExample/storeValueFromNode2");

test("[MultiNodeExample]: Can run quickstart", t => {
  t.test("deploy contract", async st => {
    const contractAddress = await deployContract();
    st.equal(contractAddress, "0x2f351161a80d74047316899342eedc606b13f9f8");
    st.end();
  });

  t.test("store and gets from node 1", async st => {
    const result = await node1Example.storeValueFromNode1(
      "0x2f351161a80d74047316899342eedc606b13f9f8",
      1000
    );

    st.equal(
      result.logs[0].data,
      "0x000000000000000000000000fe3b557e8fb62b89f4916b721be55ceb828dbd7300000000000000000000000000000000000000000000000000000000000003e8"
    );

    const getNode1 = await node1Example.getValueFromNode1(
      "0x2f351161a80d74047316899342eedc606b13f9f8"
    );

    st.equal(
      getNode1.output,
      "0x00000000000000000000000000000000000000000000000000000000000003e8"
    );

    const getNode2 = await node1Example.getValueFromNode2(
      "0x2f351161a80d74047316899342eedc606b13f9f8"
    );

    st.equal(
      getNode2.output,
      "0x00000000000000000000000000000000000000000000000000000000000003e8"
    );

    const getNode3 = await node1Example.getValueFromNode3(
      "0x2f351161a80d74047316899342eedc606b13f9f8"
    );

    st.equal(getNode3.output, "0x");

    st.end();
  });

  t.test("store and gets from node 2", async st => {
    const result = await node2Example.storeValueFromNode2(
      "0x2f351161a80d74047316899342eedc606b13f9f8",
      42
    );

    st.equal(
      result.logs[0].data,
      "0x000000000000000000000000627306090abab3a6e1400e9345bc60c78a8bef57000000000000000000000000000000000000000000000000000000000000002a"
    );

    const getNode1 = await node2Example.getValueFromNode1(
      "0x2f351161a80d74047316899342eedc606b13f9f8"
    );

    st.equal(
      getNode1.output,
      "0x000000000000000000000000000000000000000000000000000000000000002a"
    );

    const getNode2 = await node2Example.getValueFromNode2(
      "0x2f351161a80d74047316899342eedc606b13f9f8"
    );

    st.equal(
      getNode2.output,
      "0x000000000000000000000000000000000000000000000000000000000000002a"
    );

    const getNode3 = await node2Example.getValueFromNode3(
      "0x2f351161a80d74047316899342eedc606b13f9f8"
    );

    st.equal(getNode3.output, "0x");

    st.end();
  });
});
