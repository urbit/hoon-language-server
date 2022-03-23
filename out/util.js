"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
function request(url, options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, options, res => {
            let data = "";
            res.on("data", chunk => {
                data += chunk;
            });
            res.on("end", () => {
                resolve({ req, res, data });
            });
            res.on("error", e => {
                reject(e);
            });
        });
        if (body) {
            req.write(body);
        }
        req.end();
    });
}
exports.request = request;
function wait(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
exports.wait = wait;
//# sourceMappingURL=util.js.map