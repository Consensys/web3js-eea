const tape = require("tape");
const { generatePrivacyGroup } = require("../../src/privacyGroup");
const txFixtures = require("./support/keySets.json");

tape("[EEA]: Privacy Group Generation", t => {
  t.test("should generate correct privacy group id", st => {
    /* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
    txFixtures.forEach(pg => {
      const expected = pg.privacyGroupId;
      const input = pg.privacyGroup;
      st.equal(generatePrivacyGroup({ privateFrom: input }), expected);
    });
    st.end();
  });
});
