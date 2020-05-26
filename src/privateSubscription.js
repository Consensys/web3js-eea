const EventEmitter = require("events");

const Protocol = {
  HTTP: "HTTP",
  WEBSOCKET: "WebSocket"
};

const Event = {
  CONNECTED: "connected",
  DATA: "data",
  ERROR: "error"
};

/**
 * Manage a specific type of subscription
 * @param {PrivateSubscription} subscription
 */
function SubscriptionManager(subscription) {
  this.subscription = subscription;
  this.web3 = subscription.web3;

  return this;
}

/**
 * Manage creating/destroying filter and polling for new logs
 * using `priv_getFilterChanges`
 * @param {PrivateSubscription} subscription
 */
function PollingSubscription(subscription, pollingInterval) {
  SubscriptionManager.call(this, subscription);

  this.privacyGroupId = subscription.privacyGroupId;
  this.filter = subscription.filter;
  this.timeout = null;
  // How frequently to poll for new logs, in milliseconds
  this.pollingInterval = pollingInterval || 1000;

  return this;
}
PollingSubscription.prototype = Object.create(SubscriptionManager.prototype);
PollingSubscription.prototype.constructor = PollingSubscription;

PollingSubscription.prototype.subscribe = async function subscribe(
  privacyGroupId,
  filter,
  blockId
) {
  // install filter
  this.subscription.filterId = await this.web3.priv.createFilter(
    privacyGroupId,
    filter,
    blockId
  );

  // wait for new logs
  await this.pollForLogs(privacyGroupId, this.subscription.filterId);
};

PollingSubscription.prototype.getPastLogs = async function getPastLogs(
  privacyGroupId,
  filterId
) {
  return this.web3.priv.getFilterLogs(privacyGroupId, filterId);
};

PollingSubscription.prototype.pollForLogs = async function pollForLogs(
  privacyGroupId,
  filterId
) {
  const fetchLogs = async () => {
    try {
      const logs = await this.web3.priv.getFilterChanges(
        privacyGroupId,
        filterId
      );
      logs.forEach(log => {
        this.subscription.emit("data", log);
      });
      // continue
      this.timeout = setTimeout(() => {
        this.pollForLogs(privacyGroupId, filterId);
      }, this.pollingInterval);
    } catch (error) {
      this.subscription.emit("error", error);
    }
  };

  fetchLogs();
};

PollingSubscription.prototype.unsubscribe = async function unsubscribe(
  privacyGroupId,
  filterId,
  callback
) {
  return this.web3.priv
    .uninstallFilter(privacyGroupId, filterId)
    .then(() => {
      if (this.timeout != null) {
        clearTimeout(this.timeout);
      }
      this.subscription.reset();

      if (callback != null) {
        callback(null, true);
      }
      return filterId;
    })
    .catch(error => {
      if (callback != null) {
        callback(error);
      }
      return error;
    });
};

/**
 * Manage persistent pub-sub subscriptions over WebSocket
 * @param {PrivateSubscription} subscription
 */
function PubSubSubscription(subscription) {
  SubscriptionManager.call(this, subscription);
  return this;
}
PubSubSubscription.prototype = Object.create(SubscriptionManager.prototype);
PubSubSubscription.prototype.constructor = PubSubSubscription;

PubSubSubscription.prototype.subscribe = async function subscribe(
  privacyGroupId,
  filter
) {
  // Register provider events to forward to the caller
  this.web3.currentProvider
    .on("connect", () => {
      this.subscription.emit(Event.CONNECTED);
    })
    .on("data", data => {
      // Log is in `params` key of JSON-RPC response
      this.subscription.emit(Event.DATA, data.params);
    })
    .on("error", e => {
      this.subscription.emit(Event.ERROR, e);
    });

  // start subscription
  this.subscription.filterId = await this.web3.privInternal.subscribe(
    privacyGroupId,
    "logs",
    filter
  );
};

PubSubSubscription.prototype.getPastLogs = async function getPastLogs() {
  // noop - subscriptions don't get past logs
  return Promise.resolve([]);
};

PubSubSubscription.prototype.unsubscribe = async function unsubscribe(
  privacyGroupId,
  filterId,
  callback
) {
  return this.web3.privInternal
    .unsubscribe(privacyGroupId, filterId)
    .then(result => {
      this.subscription.reset();

      callback(null, result);
      return result;
    })
    .catch(error => {
      if (callback != null) {
        callback(error);
      }
      return error;
    });
};

/**
 * Controls the lifecycle of a private subscription
 * @param {*} web3
 * @param {*} privacyGroupId
 * @param {*} filter
 */
function PrivateSubscription(web3, privacyGroupId, filter) {
  this.privacyGroupId = privacyGroupId;
  this.filter = filter;

  this.web3 = web3;
  this.filterId = null;

  this.getPast = false;

  const providerType = web3.currentProvider.constructor.name;
  if (providerType === "HttpProvider") {
    this.protocol = Protocol.HTTP;
    this.manager = new PollingSubscription(
      this,
      this.web3.priv.subscriptionPollingInterval
    );
    // TODO: handle WebSockets if the node doesn't support priv_subscribe
  } else if (providerType === "WebsocketProvider") {
    this.protocol = Protocol.WEBSOCKET;
    this.manager = new PubSubSubscription(this);
  } else {
    throw new Error(
      "Current protocol does not support subscriptions. Use HTTP or WebSockets."
    );
  }

  return this;
}

// get functions from EventEmitter
PrivateSubscription.prototype = Object.create(EventEmitter.prototype);
PrivateSubscription.prototype.constructor = PrivateSubscription;

PrivateSubscription.prototype.subscribe = async function subscribe() {
  // If `fromBlock` is set, get previous logs when the user adds
  // a callback for the "data" event.
  if (this.filter.fromBlock != null) {
    this.getPast = true;
  }

  // Sets this.filterId
  await this.manager.subscribe(this.privacyGroupId, this.filter, this.blockId);
  if (this.filterId == null) {
    throw new Error("Failed to set filter ID");
  }

  return this.filterId;
};

PrivateSubscription.prototype.on = function on(eventName, callback) {
  // Register the callback
  EventEmitter.prototype.on.call(this, eventName, callback);

  // Get past logs if necessary once the user has added a callback
  if (this.getPast && eventName === "data") {
    // Execute asynchronously so we can return immediately
    // eslint-disable-next-line promise/catch-or-return
    this.manager
      .getPastLogs(this.privacyGroupId, this.filterId)
      .then(pastLogs => {
        pastLogs.forEach(log => {
          this.emit("data", log);
        });
        return pastLogs;
      });
  }

  return this;
};

PrivateSubscription.prototype.reset = function reset() {
  this.removeAllListeners();
};

PrivateSubscription.prototype.unsubscribe = async function unsubscribe(
  callback
) {
  return this.manager.unsubscribe(this.privacyGroupId, this.filterId, callback);
};

module.exports = {
  PrivateSubscription
};
