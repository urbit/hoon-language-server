import { request, Config } from "./util";
import * as EventSource from "eventsource";

export default class Channel {
  uid: string;
  requestId: number;
  eventSource: EventSource | null;
  lastEventId: number;
  lastAcknowledgedEventId: number;
  outstandingPokes: Map<number, any>;
  outstandingSubscriptions: Map<number, any>;

  constructor(
    private cookies: string[],
    private url: string,
    private logger: any,
    private config: Config
  ) {
    //  unique identifier: current time and random number
    //
    this.uid =
      new Date().getTime().toString() +
      "-" +
      Math.random()
        .toString(16)
        .slice(-6);

    this.requestId = 1;

    //  the currently connected EventSource
    //
    this.eventSource = null;

    //  the id of the last EventSource event we received
    //
    this.lastEventId = 0;

    //  this last event id acknowledgment sent to the server
    //
    this.lastAcknowledgedEventId = 0;

    //  a registry of requestId to successFunc/failureFunc
    //
    //    These functions are registered during a +poke and are executed
    //    in the onServerEvent()/onServerError() callbacks. Only one of
    //    the functions will be called, and the outstanding poke will be
    //    removed after calling the success or failure function.
    //

    this.outstandingPokes = new Map();

    //  a registry of requestId to subscription functions.
    //
    //    These functions are registered during a +subscribe and are
    //    executed in the onServerEvent()/onServerError() callbacks. The
    //    event function will be called whenever a new piece of data on this
    //    subscription is available, which may be 0, 1, or many times. The
    //    disconnect function may be called exactly once.
    //
    this.outstandingSubscriptions = new Map();
  }

  //  sends a poke to an app on an urbit ship
  //
  poke(
    ship: string,
    app: string,
    mark: string,
    json: any,
    successFunc: any,
    failureFunc: any
  ) {
    let id = this.nextId();
    this.outstandingPokes.set(id, {
      success: successFunc,
      fail: failureFunc
    });

    this.sendJSONToChannel({
      id,
      action: "poke",
      ship,
      app,
      mark,
      json
    });
  }

  //  subscribes to a path on an specific app and ship.
  //
  //    Returns a subscription id, which is the same as the same internal id
  //    passed to your Urbit.
  subscribe(
    ship: string,
    app: string,
    path: string,
    connectionErrFunc = (e: any) => {},
    eventFunc = (e: any) => {},
    quitFunc = (e: any) => {}
  ) {
    let id = this.nextId();
    this.outstandingSubscriptions.set(id, {
      err: connectionErrFunc,
      event: eventFunc,
      quit: quitFunc
    });

    this.sendJSONToChannel({
      id,
      action: "subscribe",
      ship,
      app,
      path
    });

    return id;
  }

  //  unsubscribe to a specific subscription
  //
  unsubscribe(subscription: string) {
    let id = this.nextId();
    this.sendJSONToChannel({
      id,
      action: "unsubscribe",
      subscription
    });
  }

  //  sends a JSON command command to the server.
  //
  sendJSONToChannel(j: unknown) {
    this.logger.info({ message: "Sending JSON to channel", json: j });
    let body: any;
    if (this.lastEventId == this.lastAcknowledgedEventId) {
      body = JSON.stringify([j]);
    } else {
      //  we add an acknowledgment to clear the server side queue
      //
      //    The server side puts messages it sends us in a queue until we
      //    acknowledge that we received it.
      //
      body = JSON.stringify([
        { action: "ack", "event-id": this.lastEventId },
        j
      ]);

      this.lastEventId = this.lastAcknowledgedEventId;
    }
    return request(
      this.channelURL(),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": body.length,
          Cookie: this.cookies
        },
        port: this.config.port
      },
      body
    ).then(r => {
      this.logger.info({ message: "Response", data: r.data });
      return this.connectIfDisconnected();
    });
  }

  //  connects to the EventSource if we are not currently connected
  //
  connectIfDisconnected() {
    if (this.eventSource) {
      return;
    }

    const eventSource = new EventSource(this.channelURL(), {
      headers: { Cookie: this.cookies[0], Connection: "keep-alive" },
      withCredentials: true
    });
    eventSource.onmessage = (e: MessageEvent) => {
      this.lastEventId = parseInt(e.lastEventId, 10);

      let obj = JSON.parse(e.data);
      if (obj.response == "poke") {
        let funcs = this.outstandingPokes.get(obj.id);
        if (obj.hasOwnProperty("ok")) {
          funcs["success"]();
        } else if (obj.hasOwnProperty("err") && funcs) {
          funcs["fail"](obj.err);
        } else {
          this.logger.warn("Invalid poke response: ", { response: obj });
        }
        this.outstandingPokes.delete(obj.id);
      } else if (obj.response == "subscribe") {
        //  on a response to a subscribe, we only notify the caller on err
        //
        let funcs = this.outstandingSubscriptions.get(obj.id);
        if (obj.hasOwnProperty("err")) {
          funcs["err"](obj.err);
          this.outstandingSubscriptions.delete(obj.id);
        }
      } else if (obj.response == "diff") {
        let funcs = this.outstandingSubscriptions.get(obj.id);
        funcs["event"](obj.json);
      } else if (obj.response == "quit") {
        let funcs = this.outstandingSubscriptions.get(obj.id);
        funcs["quit"](obj);
        this.outstandingSubscriptions.delete(obj.id);
      } else {
        this.logger.warn("Unrecognized response", { event: e });
      }
    };

    eventSource.onerror = e => {
      this.logger.warn("Event Source error", { error: e });
    };
    this.eventSource = eventSource;
  }

  channelURL() {
    return this.url + ":" + this.config.port + "/~/channel/" + this.uid;
  }

  nextId() {
    return this.requestId++;
  }
}
