import { REQUEST_MARK, RESPONSE_MARK, NOTIFICATION_MARK } from "./marks";
import * as rpc from "vscode-jsonrpc";
import { NotificationMessage, RequestMessage } from "vscode-languageserver";
import pino from "pino";
import { uniqueId } from "lodash";
import * as qs from "querystring";
import * as yargs from "yargs";
import { Channel } from "urbit-airlock/lib/channel";
import { connect } from "urbit-airlock/lib/setup";

import { wait, request, Config } from "./util";

const logger = pino(
  pino.destination("/tmp/hoon-language-server.log")
);

interface RequestContinuation {
  (result: any): void;
}

const app = "language-server";
const path = "/primary";

class Server {
  connection: rpc.MessageConnection;
  subscription: number | null = null;
  outstandingRequests: Map<string, RequestContinuation> = new Map();
  constructor(private channel: Channel, private delay: number) {
    this.connection = rpc.createMessageConnection(
      new rpc.StreamMessageReader(process.stdin),
      new rpc.StreamMessageWriter(process.stdout)
    );
    
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
    
    this.channel.subscribe(app, path, {
      mark: "json",
      onError: (e: any) => this.onSubscriptionErr(e),
      onEvent: (u: any) => this.onSubscriptionUpdate(u),
      onQuit: (e: any) => this.onSubscriptionErr(e)
    });
    new Promise(() => this.connection.listen()).catch(e => {
      logger.error({ message: `error somewhere`, e });
      
    });
  }

  // handlers

  onNotification(method: string, params: any[]) {
    if (method === "textDocument/didSave") {
      wait(this.delay).then(() => {
        logger.debug("Delayed didSave");
        this.pokeNotification({ jsonrpc: "2.0", method, params });
      });
    }
    this.pokeNotification({ jsonrpc: "2.0", method, params });
  }

  onRequest(method: string, params: any[]) {
    const id = uniqueId();

    if (method === "initialize") {
      return this.initialise();
    } else {
      logger.info({ message: `caught request`, id });
      this.pokeRequest({ jsonrpc: "2.0", method, params, id });
      return this.waitOnResponse(id).then(r => {
        return r;
      }).catch(e => {
        logger.error({ message: `error on request`, id, e });
      });
    }
  }

  waitOnResponse(id: string) {
    return new Promise((resolve, reject) => {
      this.outstandingRequests.set(id, resolve);
    }).catch(e => {
      logger.error({ message: "waitOnResponse", e });
    });
  }

  pokeRequest(message: RequestMessage) {
    return this.channel.poke(app, { mark: REQUEST_MARK, data: message });
  }

  pokeNotification(message: NotificationMessage) {
    return this.channel.poke(app, { mark: NOTIFICATION_MARK, data: message });
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

(async function main() {
  const { ship, url, code: password, port, delay }: Config = yargs.options({
    port: {
      alias: "p",
      default: 80,
      description: "HTTP port of the running urbit"
    },
    delay: {
      alias: "d",
      default: 0,
      description: "Delay for running didSave events"
    },
    url: {
      alias: "u",
      default: "http://localhost",
      description: "URL of the running urbit"
    },
    ship: {
      alias: "s",
      default: "zod",
      description: "@p of the running urbit, without leading sig"
    },
    code: {
      alias: "c",
      default: "lidlut-tabwed-pillex-ridrup",
      description: "+code of the running urbit"
    }
  }).argv;

  const connection = await connect(ship, url, port, password);

  const channel = new Channel(connection);

  const server = new Server(channel, delay);

  server.serve();
})();
