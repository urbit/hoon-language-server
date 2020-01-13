import * as rpc from "vscode-jsonrpc";
import { NotificationMessage, RequestMessage } from "vscode-languageserver";
import * as pino from "pino";
import { uniqueId } from "lodash";
import * as qs from "querystring";
import * as yargs from "yargs";

import { wait, request, Config } from "./util";
import Channel from "./channel";

const logger = pino(
  { level: "trace" },
  pino.destination("/tmp/hoon-language-server.log")
);
const url = "http://localhost";
const app = "language-server";
const path = "/primary";
const ship = "zod";

enum MARKS {
  REQUEST = "language-server-rpc-request",
  NOTIFICATION = "language-server-rpc-notification",
  RESPONSE = "language-server-rpc-response"
}

interface RequestContinuation {
  (result: any): void;
}

class Server {
  connection: rpc.MessageConnection;
  subscription: number | null = null;
  outstandingRequests: Map<string, RequestContinuation> = new Map();
  constructor(private channel: Channel, private config: Config) {
    this.connection = rpc.createMessageConnection(
      new rpc.StreamMessageReader(process.stdin),
      new rpc.StreamMessageWriter(process.stdout)
    );
    // this.connection.trace(rpc.Trace.Messages, tracer);

    this.connection.onNotification((method, params) =>
      this.onNotification(method, params)
    );
    this.connection.onRequest((method, params) =>
      this.onRequest(method, params)
    );
  }

  initialise() {
    return {
      capabilities: {
        hoverProvider: true,
        textDocumentSync: {
          openClose: true,
          change: 2,
          willSave: true,
          save: true
        },
        definitionProvider: true,
        completionProvider: {
          resolveProvider: false,
          triggerCharacters: [
            "-",
            "+",
            "^",
            "!",
            "@",
            "$",
            "%",
            ".",
            "%",
            "&",
            "*",
            "/",
            ",",
            ">",
            "<",
            "~",
            "|",
            "=",
            ";",
            ":",
            "_"
          ]
        },
        workspace: {
          workspaceFolders: {
            supported: true,
            changeNotifications: true
          }
        }
      }
    };
  }

  serve() {
    // const onUpdate =
    // const onError = this.onSubscriptionErr.bind(this);
    this.channel.subscribe(
      ship,
      app,
      path,
      e => this.onSubscriptionErr(e),
      u => this.onSubscriptionUpdate(u),
      e => this.onSubscriptionErr(e)
    );
    new Promise(() => this.connection.listen());
  }

  // handlers

  onNotification(method: string, params: any[]) {
    logger.debug({ method, params });
    if (method === "textDocument/didSave") {
      wait(1000).then(() => {
        logger.debug("Delayed didSave");
        this.poke(MARKS.NOTIFICATION, { jsonrpc: "2.0", method, params });
      });
    }
    this.poke(MARKS.NOTIFICATION, { jsonrpc: "2.0", method, params });
  }

  onRequest(method: string, params: any[]) {
    const id = uniqueId();
    logger.debug({ method });

    if (method === "initialize") {
      return this.initialise();
    } else {
      logger.info({ message: `caught request`, id });
      this.poke(MARKS.REQUEST, { jsonrpc: "2.0", method, params, id });
      return this.waitOnResponse(id).then(r => {
        logger.info({ message: `returning request`, id, r });
        return r;
      });
    }
  }

  waitOnResponse(id: string) {
    return new Promise((resolve, reject) => {
      this.outstandingRequests.set(id, resolve);
    });
  }

  poke(mark: MARKS, message: NotificationMessage | RequestMessage) {
    return new Promise((resolve, reject) =>
      this.channel.poke(ship, app, mark, message, resolve, reject)
    ).catch(e => {
      logger.warn("Failed to poke", { error: e });
    });
  }

  // Subscriptions

  onSubscriptionUpdate(update: any) {
    logger.info({ message: "Subscription update", update });

    if (update.hasOwnProperty("id")) {
      const response = this.outstandingRequests.get(update.id);
      if (response) {
        response(update.result);
      } else {
        logger.warn("Unrecognised request", { update });
      }
    } else {
      this.connection.sendNotification(update.method, update.params);
    }
  }

  onSubscriptionErr(e: any) {
    logger.fatal({ message: "Subscription Errored", e });
  }

  onSubscriptionQuit(e: any) {
    logger.fatal({ message: "Subscription Quit", e });
  }
}

let data = { password: "lidlut-tabwed-pillex-ridrup" };

const config: Config = yargs.options({
  port: {
    alias: "p",
    default: 8080,
    description: "HTTP port of the running urbit"
  },
  delay: {
    alias: "d",
    default: 0
  }
}).argv;

request(
  url + "/~/login",
  { method: "post", port: config.port },
  qs.stringify(data)
).then(({ res }) => {
  logger.info({
    message: "Got cookie",
    cookie: res.headers["set-cookie"] || "no-cookie"
  });
  const channel = new Channel(
    res.headers["set-cookie"] || [],
    url,
    logger,
    config
  );
  const server = new Server(channel, config);

  server.serve();
});
