const Web3 = require("web3");

function logMatchingGroup(findResult, pgId) {
  const groups = Object.values(findResult);
  console.log(`TOTAL number of matching privacy groups = ${groups.length}`);
  groups.forEach(group => {
    // only log the group with the given id
    if (group.privacyGroupId === pgId) {
      console.log("FIND Privacy Group Result:");
      console.log(group);
    }
  });
}

function createHttpProvider(jwtToken, besuNodeUrl) {
  const httpProviderWithJwt = new Web3.providers.HttpProvider(besuNodeUrl, {
    headers: [
      {
        name: "Authorization",
        value: `Bearer ${jwtToken}`
      }
    ]
  });
  return httpProviderWithJwt;
}

module.exports = {
  logMatchingGroup,
  createHttpProvider
};
