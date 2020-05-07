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

function PrivateSubscription(web3, privacyGroupId, filter) {
  const providerType = web3.currentProvider.constructor.name;
  if (providerType === "HttpProvider") {
    this.protocol = Protocol.HTTP;
  } else if (providerType === "WebsocketProvider") {
    this.protocol = Protocol.WEBSOCKET;
  } else {
    throw new Error(
      "Current protocol does not support subscriptions. Use HTTP or WebSockets."
    );
  }

  this.privacyGroupId = privacyGroupId;
  this.filter = filter;

  this.web3 = web3;
  this.filterId = null;

  this.timer = undefined;
  this.getPast = false;

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

  if (this.protocol === Protocol.HTTP) {
    // install filter
    this.filterId = await this.web3.priv.createFilter(
      this.privacyGroupId,
      this.filter,
      this.blockId
    );

    // wait for new logs
    await this.pollForLogs();
  } else if (this.protocol === Protocol.WEBSOCKET) {
    // Register provider events to forward to the caller
    this.web3.currentProvider
      .on("connect", () => {
        this.emit(Event.CONNECTED);
      })
      .on("data", data => {
        // Log is in `params` key of JSON-RPC response
        this.emit(Event.DATA, data.params);
      })
      .on("error", e => {
        this.emit(Event.ERROR, e);
      });

    // start subscription
    this.filterId = await this.web3.privInternal.subscribe(
      this.privacyGroupId,
      "logs",
      this.filter
    );
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
    this.web3.priv
      .getPastLogs(this.privacyGroupId, this.filter)
      .then(pastLogs => {
        pastLogs.forEach(log => {
          this.emit("data", log);
        });
        return pastLogs;
      });
  }

  return this;
};

PrivateSubscription.prototype.pollForLogs = async function pollForLogs(
  ms = 1000
) {
  const fetchLogs = async () => {
    try {
      const logs = await this.web3.priv.getFilterChanges(
        this.privacyGroupId,
        this.filterId
      );
      logs.forEach(log => {
        this.emit("data", log);
      });
      // continue
      this.timeout = setTimeout(() => {
        this.pollForLogs(ms);
      }, ms);
    } catch (error) {
      this.emit("error", error);
    }
  };

  fetchLogs();
};

PrivateSubscription.prototype.reset = function reset() {
  if (this.timeout != null) {
    clearTimeout(this.timeout);
  }

  this.removeAllListeners();
};

PrivateSubscription.prototype.unsubscribe = async function unsubscribe(
  callback
) {
  const id = this.filterId;

  let operation = Promise.resolve();
  if (this.protocol === Protocol.HTTP) {
    operation = this.web3.priv
      .uninstallFilter(this.privacyGroupId, this.filterId)
      .then(() => {
        this.reset();

        if (callback != null) {
          callback(null, true);
        }
        return id;
      })
      .catch(error => {
        if (callback != null) {
          callback(error);
        }
        return error;
      });
  } else if (this.protocol === Protocol.WEBSOCKET) {
    operation = this.web3.privInternal
      .unsubscribe(this.privacyGroupId, this.filterId)
      .then(result => {
        this.reset();

        callback(null, result);
        return result;
      })
      .catch(error => {
        if (callback != null) {
          callback(error);
        }
        return error;
      });
  }

  return operation;
};

module.exports = {
  PrivateSubscription
};
