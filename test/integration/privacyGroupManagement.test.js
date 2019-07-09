const test = require("tape");

const createGroup = require("../../example/privacyGroupManagement/createPrivacyGroup");
const findGroup = require("../../example/privacyGroupManagement/findPrivacyGroup");
const deleteGroup = require("../../example/privacyGroupManagement/deletePrivacyGroup");

test("[MultiNodeExample]: Can manage privacy groups", t => {
  let PRIVACY_GROUP_ID;
  t.test("can create privacy group", async st => {
    PRIVACY_GROUP_ID = await createGroup.createPrivacyGroup();

    st.end();
  });

  t.test("can find privacy group", async st => {
    const returnedPrivacyGroup = await findGroup();

    st.equal(PRIVACY_GROUP_ID, returnedPrivacyGroup[0].privacyGroupId);
    st.end();
  });

  t.test("can delete privacy group", async st => {
    const deletedGroup = await deleteGroup.deletePrivacyGroup(PRIVACY_GROUP_ID);

    st.equal(deletedGroup, PRIVACY_GROUP_ID);
    st.end();
  });

  t.test("cannot find once deleted", async st => {
    const returnedPrivacyGroup = await findGroup();

    st.equal(returnedPrivacyGroup.length, 0);
    st.end();
  });

  t.test("create twice and delete once", async st => {
    const newPrivacyGroup1 = await createGroup.createPrivacyGroup();
    const newPrivacyGroup2 = await createGroup.createPrivacyGroup();

    let privacyGroupList = await findGroup();

    st.equal(privacyGroupList.length, 2);

    st.equal(privacyGroupList.includes(newPrivacyGroup1), true);
    st.equal(privacyGroupList.includes(newPrivacyGroup2), true);

    const deletedGroup = await deleteGroup.deletePrivacyGroup(newPrivacyGroup1);

    st.equal(deletedGroup, newPrivacyGroup1);

    privacyGroupList = await findGroup();

    st.equal(privacyGroupList.length, 1);

    st.equal(privacyGroupList.includes(newPrivacyGroup1), false);
    st.equal(privacyGroupList.includes(newPrivacyGroup2), true);

    st.end();
  });
});
