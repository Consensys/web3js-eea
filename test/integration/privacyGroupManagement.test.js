const test = require("tape");

const createGroup = require("../../example/privacyGroupManagement/createPrivacyGroup");
const findGroup = require("../../example/privacyGroupManagement/findPrivacyGroup");
const deleteGroup = require("../../example/privacyGroupManagement/deletePrivacyGroup");

test("[MultiNodeExample]: Can manage privacy groups", t => {
  t.test("can create and find privacy group", async st => {
    const createdGroupId = await createGroup.createPrivacyGroup();

    const returnedPrivacyGroup = await findGroup.findPrivacyGroup();

    const listWithPrivacyGroup = returnedPrivacyGroup.filter(i => {
      return i.privacyGroupId === createdGroupId;
    });

    st.equal(createdGroupId, listWithPrivacyGroup[0].privacyGroupId);
    st.end();
  });

  t.test("can create, find and delete privacy group", async st => {
    const createdGroupId = await createGroup.createPrivacyGroup();

    let returnedPrivacyGroup = await findGroup.findPrivacyGroup();

    const listWithPrivacyGroup = returnedPrivacyGroup.filter(i => {
      return i.privacyGroupId === createdGroupId;
    });

    st.equal(createdGroupId, listWithPrivacyGroup[0].privacyGroupId);

    const deletedGroup = await deleteGroup.deletePrivacyGroup(createdGroupId);

    st.equal(deletedGroup, createdGroupId);

    returnedPrivacyGroup = await findGroup.findPrivacyGroup();

    const listWithPrivacyGroupAfterDelete = returnedPrivacyGroup.filter(i => {
      return i.privacyGroupId === deletedGroup;
    });

    st.equal(listWithPrivacyGroupAfterDelete.length, 0);

    st.end();
  });

  t.test("create twice and delete once", async st => {
    const newPrivacyGroup1 = await createGroup.createPrivacyGroup();
    const newPrivacyGroup2 = await createGroup.createPrivacyGroup();

    let privacyGroupList = await findGroup.findPrivacyGroup();

    let newListWithPrivacyGroup1 = privacyGroupList.filter(i => {
      return i.privacyGroupId === newPrivacyGroup1;
    });

    st.equal(newListWithPrivacyGroup1.length, 1);

    let newListWithPrivacyGroup2 = privacyGroupList.filter(i => {
      return i.privacyGroupId === newPrivacyGroup2;
    });

    st.equal(newListWithPrivacyGroup2.length, 1);

    const deletedGroup = await deleteGroup.deletePrivacyGroup(newPrivacyGroup1);

    st.equal(deletedGroup, newPrivacyGroup1);

    privacyGroupList = await findGroup.findPrivacyGroup();

    newListWithPrivacyGroup1 = privacyGroupList.filter(i => {
      return i.privacyGroupId === newPrivacyGroup1;
    });

    st.equal(newListWithPrivacyGroup1.length, 0);

    newListWithPrivacyGroup2 = privacyGroupList.filter(i => {
      return i.privacyGroupId === newPrivacyGroup2;
    });

    st.equal(newListWithPrivacyGroup2.length, 1);

    st.end();
  });
});
