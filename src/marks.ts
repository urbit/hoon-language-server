import { Marks } from 'urbit-airlock/lib/marks';
import { NotificationMessage, RequestMessage } from "vscode-languageserver";

export const REQUEST_MARK = "language-server-rpc-request";
export const NOTIFICATION_MARK = "language-server-rpc-notification";
export const RESPONSE_MARK = "language-server-rpc-response";


declare module "urbit-airlock/lib/marks" {
  interface Marks {
    readonly [REQUEST_MARK]: RequestMessage;
    readonly [NOTIFICATION_MARK]: NotificationMessage;
    readonly [RESPONSE_MARK]: any;
  }
}
