const util = require("util");
const exec = util.promisify(require("child_process").exec);

const logOutput = ({ stdout, stderr }) => {
  console.log("stdout:", stdout);
  console.log("stderr:", stderr);
  return Promise.resolve({});
};

const stopPrivacyDocker = () => {
  return exec("cd docker && ./stop.sh && ./remove.sh").then(logOutput);
};

stopPrivacyDocker().catch(console.error);
