"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const rpc = __importStar(require("vscode-jsonrpc"));
let connection = rpc.createMessageConnection(new rpc.StreamMessageReader(process.stdin), new rpc.StreamMessageWriter(process.stdout));
let notification = new rpc.NotificationType('testNotification');
connection.onNotification((method, params) => {
    console.log(method);
    console.log(params); // This prints Hello World
});
connection.onRequest((method, params) => {
    console.log(method);
    console.log(params); // This prints Hello World
});
connection.listen();
// import {
// 	createConnection,
// 	TextDocuments,
// 	TextDocument,
// 	Diagnostic,
// 	DiagnosticSeverity,
// 	ProposedFeatures,
// 	InitializeParams,
// 	DidChangeConfigurationNotification,
// 	CompletionItem,
// 	CompletionItemKind,
//   TextDocumentPositionParams,
//   RequestMessage
// } from 'vscode-languageserver';
// type ParsingLocation = "header" | "content" | "ready";
// process.stdin.setEncoding('utf-8');
// let messages: string[] = [];
// let location: ParsingLocation = "header";
// function handleNewChunk(chunk: string) {
// }
// process.stdin.on('readable', () => {
//   let chunk;
//   // Use a loop to make sure we read all available data.
//   while ((chunk = process.stdin.read()) !== null) {
// 	handleNewChunk(chunk);
// 	messages.push(chunk)
//   }
//   console.log(messages);
// });
// process.on('exit', () => {
//   console.log(messages)
// })
// process.stdin.on('end', () => {
//   process.stdout.write('end');
// });
//# sourceMappingURL=index.js.map