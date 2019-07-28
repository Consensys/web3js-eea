const test = require("tape");

const createGroup = require("../../example/privacyGroupManagement/createPrivacyGroup");
const createGroupNode2 = require("../../example/privacyGroupManagement/createPrivacyGroupNode2");
const findGroup = require("../../example/privacyGroupManagement/findPrivacyGroup");
const findGroupNode2 = require("../../example/privacyGroupManagement/findPrivacyGroupNode2");

test("[MultiNodeExample]: Can manage privacy groups", t => {
  t.test("can create and find privacy group", async st => {
    const privacyGroup12 = await createGroup.createPrivacyGroup();

    const listPrivacyGroups = await findGroup.findPrivacyGroup();

    const listWithPrivacyGroupAfterCreate = listPrivacyGroups.filter(i => {
      return i.privacyGroupId === privacyGroup12;
    });

    st.equal(listWithPrivacyGroupAfterCreate.length, 1);

    const privacyGroup23 = await createGroupNode2.createPrivacyGroupForNode23();

    const listFindFromNode1 = await findGroup.findPrivacyGroupForNode23();

    // node1 should not see privacyGroup23
    st.equal(listFindFromNode1.length, 0);

    const listFromNode2 = await findGroupNode2.findPrivacyGroupForNode23();

    const listWithPrivacyGroupNode2AfterCreate23 = listFromNode2.filter(i => {
      return i.privacyGroupId === privacyGroup23;
    });

    st.equal(listWithPrivacyGroupNode2AfterCreate23.length, 1);

    st.end();
  });
});
