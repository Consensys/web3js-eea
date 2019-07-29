const tape = require("tape");
const Enclave = require("../../src/index");
const txFixtures = require("./support/keySets.json");

tape("[EEA]: Privacy Group Generation", t => {
  t.test("should generate correct privacy group id", st => {
    /* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
    txFixtures.forEach(pg => {
      const expected = pg.privacyGroupId;
      const input = pg.privacyGroup;
      const enclave = new Enclave({ eth: { currentProvider: { host: "" } } });
      st.equal(
        enclave.priv.generatePrivacyGroup({ privateFrom: input }),
        expected
      );
    });
    st.end();
  });
});
