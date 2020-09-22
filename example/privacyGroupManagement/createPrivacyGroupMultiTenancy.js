const Web3 = require("web3");
const EEAClient = require("../../src");
const { orion, besu } = require("../keys.js");

// TODO read this from a file
// this is orion10-jwt
const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJtaXNzaW9ucyI6WyIqOioiXSwicHJpdmFjeVB1YmxpY0tleSI6IkdHaWxFa1hMYVE5eWhodGJwQlQwM01lOWlZYTdVL21XWHhySmhuYmwxWFk9IiwiZXhwIjoxNjAwODk5OTk5MDAyfQ.pSMwiHSnVu3C1r8eH6OFnJIqWM4HG8n9OWbMHh0Qlw8j3k4RYp2BDBQjyS_qjSL2b2bSaHsEJ3y8EeTQK7Watitc3qs_KdS0If6z2Sn7-jGJjtqePAvl32zYtGRzFkbwI1DZGIkYfjjkc__1pKCwhJ_rQ9ggFuoh8AYzpz3F7aAGUFh9NMWl8WmT1bBjfyMgb7yUUV97UbfUOgI4CChrje0vWT5jGNyAweaNYrtHPxfXECySs99cMoqLBcsg6_ypUcrCXuONBZlI2e0bDLwpwrpfZj7YWLsxtPf2AxVN4JMGBwuuy5Rl4J3IHynm3JjgezPVS4UXKvUggb17XOGf5Q";

const httpProviderWithJwt = new Web3.providers.HttpProvider(besu.node1.url, {
  headers: [
    {
      name: "Authorization",
      value: `Bearer ${token}`
    }
  ]
});

const web3 = new EEAClient(new Web3(httpProviderWithJwt), 2018);

const createPrivacyGroup = () => {
  const contractOptions = {
    addresses: [orion.node1.publicKey, orion.node12.publicKey],
    name: "web3js-eea",
    description: "test"
  };
  return web3.priv.createPrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy group created is:`, result);
    return result;
  });
};

const createPrivacyGroupForNode123 = () => {
  const contractOptions = {
    addresses: [
      orion.node1.publicKey,
      orion.node11.publicKey,
      orion.node12.publicKey
    ],
    name: "web3js-eea",
    description: "test"
  };
  return web3.priv.createPrivacyGroup(contractOptions).then(result => {
    console.log(`The privacy group created is:`, result);
    return result;
  });
};

module.exports = {
  createPrivacyGroup,
  createPrivacyGroupForNode123
};

if (require.main === module) {
  createPrivacyGroup();
}
