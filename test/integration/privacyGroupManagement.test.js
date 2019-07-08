const test = require("tape");

const createGroup = require("../../example/privacyGroupManagement/createPrivacyGroup");
const findGroup = require("../../example/privacyGroupManagement/findPrivacyGroup");
const deleteGroup = require("../../example/privacyGroupManagement/deletePrivacyGroup");

test("[MultiNodeExample]: Can manage privacy groups", t => {
  let RESULT;
  t.test("can create privacy group", async st => {
    RESULT = await createGroup();

    st.end();
  });

  t.test("can find privacy group", async st => {
    const result1 = await findGroup();

    st.equal(RESULT, result1);

    st.end();d
  });

  t.test("can delete privacy group", async st => {
    const result2 = await deleteGroup();

    const result3 = await findGroup();

    // verify the the last find group was unsuccessful

    st.end();
  });
});
