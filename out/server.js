"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const marks_1 = require("./marks");
const rpc = __importStar(require("vscode-jsonrpc"));
const pino_1 = __importDefault(require("pino"));
const lodash_1 = require("lodash");
const yargs = __importStar(require("yargs"));
const channel_1 = require("urbit-airlock/lib/channel");
const setup_1 = require("urbit-airlock/lib/setup");
const util_1 = require("./util");
const logger = pino_1.default({ level: "trace" }, pino_1.default.destination("/tmp/hoon-language-server.log"));
const app = "language-server";
const path = "/primary";
class Server {
    constructor(channel, delay) {
        this.channel = channel;
        this.delay = delay;
        this.subscription = null;
        this.outstandingRequests = new Map();
        this.connection = rpc.createMessageConnection(new rpc.StreamMessageReader(process.stdin), new rpc.StreamMessageWriter(process.stdout));
        // this.connection.trace(rpc.Trace.Messages, tracer);
        this.connection.onNotification((method, params) => this.onNotification(method, params));
        this.connection.onRequest((method, params) => this.onRequest(method, params));
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
            onError: (e) => this.onSubscriptionErr(e),
            onEvent: (u) => this.onSubscriptionUpdate(u),
            onQuit: (e) => this.onSubscriptionErr(e)
        });
        new Promise(() => this.connection.listen());
    }
    // handlers
    onNotification(method, params) {
        logger.debug({ method, params });
        if (method === "textDocument/didSave") {
            util_1.wait(this.delay).then(() => {
                logger.debug("Delayed didSave");
                this.pokeNotification({ jsonrpc: "2.0", method, params });
            });
        }
        this.pokeNotification({ jsonrpc: "2.0", method, params });
    }
    onRequest(method, params) {
        const id = lodash_1.uniqueId();
        if (method === "initialize") {
            return this.initialise();
        }
        else {
            logger.info({ message: `caught request`, id });
            this.pokeRequest({ jsonrpc: "2.0", method, params, id });
            return this.waitOnResponse(id).then(r => {
                logger.info({ message: `returning request`, id, r });
                return r;
            });
        }
    }
    waitOnResponse(id) {
        return new Promise((resolve, reject) => {
            this.outstandingRequests.set(id, resolve);
        });
    }
    pokeRequest(message) {
        return this.channel.poke(app, { mark: marks_1.REQUEST_MARK, data: message });
    }
    pokeNotification(message) {
        return this.channel.poke(app, { mark: marks_1.NOTIFICATION_MARK, data: message });
    }
    // Subscriptions
    onSubscriptionUpdate(update) {
        logger.info({ message: "Subscription update", update });
        if (update.hasOwnProperty("id")) {
            const response = this.outstandingRequests.get(update.id);
            if (response) {
                response(update.result);
            }
            else {
                logger.warn("Unrecognised request", { update });
            }
        }
        else {
            this.connection.sendNotification(update.method, update.params);
        }
    }
    onSubscriptionErr(e) {
        logger.fatal({ message: "Subscription Errored", e });
    }
    onSubscriptionQuit(e) {
        logger.fatal({ message: "Subscription Quit", e });
    }
}
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const { ship, url, code: password, port, delay } = yargs.options({
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
        const connection = yield setup_1.connect(ship, url, port, password);
        const channel = new channel_1.Channel(connection);
        const server = new Server(channel, delay);
        server.serve();
    });
})();
//# sourceMappingURL=server.js.map