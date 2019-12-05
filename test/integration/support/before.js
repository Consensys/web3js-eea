/* eslint-disable no-underscore-dangle */
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const axios = require("axios");

axios.interceptors.response.use(undefined, function axiosRetryInterceptor(err) {
  const { config } = err;
  if (!config || !config.retry) return Promise.reject(err);
  config.__retryCount = config.__retryCount || 0;

  if (config.__retryCount >= config.retry) {
    return Promise.reject(err);
  }
  config.__retryCount += 1;

  // eslint-disable-next-line promise/avoid-new
  const backoff = new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, config.retryDelay || 1);
  });

  return backoff.then(() => {
    return axios(config);
  });
});

const logOutput = ({ stdout, stderr }) => {
  console.log("stdout:", stdout);
  console.log("stderr:", stderr);
  return Promise.resolve({});
};

const runPrivacyDocker = () => {
  return exec("cd docker && ./run.sh").then(logOutput);
};

const waitForBesu = () => {
  return axios.get("http://localhost:20000", {
    retry: 60 * 5,
    retryDelay: 1000
  });
};

runPrivacyDocker()
  .then(waitForBesu)
  .then(() => {
    // eslint-disable-next-line promise/no-return-wrap
    return Promise.resolve(console.log("Finished: Besu Network is Running"));
  })
  .catch(console.error);
