import * as http from "http";
export interface Config {
  port: number;
  delay: number;
}
interface HttpResponse {
  req: http.ClientRequest;
  res: http.IncomingMessage;
  data: string;
}
export function request(
  url: string,
  options: http.ClientRequestArgs,
  body?: string
) {
  return new Promise<HttpResponse>((resolve, reject) => {
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

export function wait(time: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, time)
  )
}
