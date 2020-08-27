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
module.exports = {
  logMatchingGroup
};
