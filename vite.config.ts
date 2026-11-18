import { spawn } from "node:child_process";
import type { ServerResponse } from "node:http";
import { defineConfig, type ConfigEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { isOlxListingUrl } from "./src/domain/olxUrl";

const olxFetchScript = `
import sys
import urllib.error
import urllib.request

page_url = sys.argv[1]
request = urllib.request.Request(
    page_url,
    headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
    },
)

try:
    with urllib.request.urlopen(request, timeout=30) as olx_response:
        status = olx_response.status
        body = olx_response.read()
except urllib.error.HTTPError as error:
    status = error.code
    body = error.read()

sys.stdout.buffer.write(str(status).encode("ascii") + b"\\n" + body)
`;

interface OlxPage {
  status: number;
  html: string;
}

function fetchOlxPage(pageUrl: string): Promise<OlxPage> {
  return new Promise(function resolveOlxPage(resolve, reject) {
    const child = spawn("python3", ["-c", olxFetchScript, pageUrl]);
    const chunks: Buffer[] = [];
    let errorText = "";

    function collectStdout(chunk: Buffer) {
      chunks.push(chunk);
    }

    function collectStderr(chunk: Buffer) {
      errorText += chunk.toString();
    }

    function finishFetch(code: number | null) {
      const isSuccess = code === 0;
      if (!isSuccess) {
        reject(new Error(errorText || "Nie udało się pobrać OLX"));
        return;
      }

      const output = Buffer.concat(chunks);
      const splitAt = output.indexOf(0x0a);
      const hasStatusLine = splitAt > 0;
      if (!hasStatusLine) {
        reject(new Error("Pusta odpowiedź OLX"));
        return;
      }

      const status = Number(output.subarray(0, splitAt).toString("ascii"));
      const html = output.subarray(splitAt + 1).toString("utf8");
      resolve({ status, html });
    }

    child.stdout.on("data", collectStdout);
    child.stderr.on("data", collectStderr);
    child.on("error", reject);
    child.on("close", finishFetch);
  });
}

async function handleOlxProxy(requestUrl: string, response: ServerResponse) {
  const request = new URL(requestUrl, "http://localhost");
  const pageUrl = request.searchParams.get("url") ?? "";
  const isAllowed = isOlxListingUrl(pageUrl);
  if (!isAllowed) {
    response.statusCode = 400;
    response.end("Niedozwolony adres");
    return;
  }

  try {
    const olxPage = await fetchOlxPage(pageUrl);
    const isOk = olxPage.status >= 200 && olxPage.status < 300;
    response.statusCode = isOk ? 200 : 502;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(olxPage.html);
  } catch {
    response.statusCode = 502;
    response.end("Nie udało się pobrać OLX");
  }
}

function olxListingProxy(): Plugin {
  return {
    name: "olx-listing-proxy",
    configureServer(server) {
      server.middlewares.use(function proxyOlxListing(request, response, next) {
        const requestUrl = request.url ?? "";
        const isOlxProxy = requestUrl.startsWith("/api/olx-listing");
        if (!isOlxProxy) {
          next();
          return;
        }

        void handleOlxProxy(requestUrl, response);
      });
    },
  };
}

function createConfig(env: ConfigEnv) {
  const isProductionBuild = env.command === "build";
  const base = isProductionBuild ? "/brazil/" : "/";

  return {
    base,
    plugins: [react(), olxListingProxy()],
    server: {
      port: 5173,
    },
  };
}

export default defineConfig(createConfig);
