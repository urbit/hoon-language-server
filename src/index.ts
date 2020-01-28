/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */


import * as rpc from 'vscode-jsonrpc';


let connection = rpc.createMessageConnection(
	new rpc.StreamMessageReader(process.stdin),
	new rpc.StreamMessageWriter(process.stdout));

let notification = new rpc.NotificationType<string, void>('testNotification');
connection.onNotification( (method: string, params: any[]) => {
  console.log(method);
  console.log(params); // This prints Hello World
});

connection.onRequest((method: string, params: any[]) => {
  console.log(method);
  console.log(params); // This prints Hello World
})

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
