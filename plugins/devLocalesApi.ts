import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";

export function devLocalesApi(): Plugin {
  return {
    name: "dev-locales-api",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      const rootDir = path.resolve(__dirname, "..");
      const localesDir = path.join(rootDir, "src", "locales");
      const localesDirWithSep = localesDir.endsWith(path.sep)
        ? localesDir
        : `${localesDir}${path.sep}`;
      const { promises: fsPromises } = fs;
      const localeFileEntries = fs
        .readdirSync(localesDir)
        .filter((file) => file.endsWith(".json"))
        .map((file) => decodeURIComponent(file))
        .reduce<Array<readonly [string, string]>>((acc, decoded) => {
          if (decoded.includes("/") || decoded.includes("\\")) {
            return acc;
          }
          const filePath = path.resolve(localesDir, decoded);
          if (!filePath.startsWith(localesDirWithSep)) {
            return acc;
          }
          acc.push([decoded, filePath]);
          return acc;
        }, []);
      const localeFileMap = new Map(localeFileEntries);
      const allowedFiles = new Set(localeFileMap.keys());

      const readRequestBody = async (
        request: IncomingMessage,
        limitBytes: number,
      ): Promise<string> => {
        return new Promise((resolve, reject) => {
          let accumulated = "";
          let totalBytes = 0;
          request.setEncoding("utf8");

          const handleEnd = () => resolve(accumulated);
          const handleError = (error: Error) => reject(error);

          const handleData = (chunk: string) => {
            totalBytes += Buffer.byteLength(chunk, "utf8");
            if (totalBytes > limitBytes) {
              request.off("data", handleData);
              request.off("end", handleEnd);
              request.off("error", handleError);
              reject(new Error("payload_too_large"));
              return;
            }
            accumulated += chunk;
          };

          request.on("data", handleData);
          request.once("end", handleEnd);
          request.once("error", handleError);
        });
      };

      const MAX_BODY_SIZE_BYTES = 2 * 1024 * 1024; // 2 MiB per locale update

      const resolveLocaleFile = (rawPath: string) => {
        if (!rawPath) return null;

        let decoded: string;
        try {
          decoded = decodeURIComponent(rawPath);
        } catch {
          return null;
        }

        if (!allowedFiles.has(decoded)) return null;

        const baseName = path.basename(decoded);
        if (
          baseName !== decoded || baseName === "" || baseName === "." ||
          baseName === ".."
        ) {
          return null;
        }

        const filePath = localeFileMap.get(decoded);
        if (!filePath) return null;

        if (!filePath.startsWith(localesDirWithSep)) {
          return null;
        }

        return { name: decoded, filePath } as const;
      };

      type SendJson = (status: number, body: unknown) => void;

      const createSendJson = (res: ServerResponse): SendJson => {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return (status, body) => {
          res.statusCode = status;
          res.end(JSON.stringify(body, null, 2));
        };
      };

      const fileExists = async (filePath: string): Promise<boolean> => {
        try {
          await fsPromises.access(filePath, fs.constants.F_OK);
          return true;
        } catch {
          return false;
        }
      };

      type ReadBodyResult =
        | { ok: true; raw: string }
        | { ok: false; status: number; error: string };

      const readBodySafe = async (
        request: IncomingMessage,
      ): Promise<ReadBodyResult> => {
        try {
          const raw = await readRequestBody(request, MAX_BODY_SIZE_BYTES);
          return { ok: true, raw };
        } catch (bodyError) {
          const message = (bodyError as Error).message;
          if (message === "payload_too_large") {
            return { ok: false, status: 413, error: "payload_too_large" };
          }
          return { ok: false, status: 400, error: "invalid_body_stream" };
        }
      };

      type ParsedContentResult =
        | { ok: true; content: unknown }
        | { ok: false; status: number; error: string };

      const parseLocalePayload = (raw: string): ParsedContentResult => {
        try {
          const body = JSON.parse(raw || "{}") as { content?: unknown };
          if (!body || typeof body !== "object" || !("content" in body)) {
            return { ok: false, status: 400, error: "invalid_body" };
          }
          return { ok: true, content: body.content };
        } catch {
          return { ok: false, status: 400, error: "invalid_json" };
        }
      };

      const handleListLocales = (sendJson: SendJson) => {
        const files = Array.from(allowedFiles);
        sendJson(200, { files });
      };

      const handleGetLocale = async (
        rawName: string,
        sendJson: SendJson,
      ): Promise<void> => {
        const resolved = resolveLocaleFile(rawName);
        if (!resolved) {
          sendJson(400, { error: "invalid_file" });
          return;
        }

        const { name, filePath } = resolved;
        if (!(await fileExists(filePath))) {
          sendJson(404, { error: "not_found" });
          return;
        }

        const content = await fsPromises.readFile(filePath, "utf-8");
        sendJson(200, { name, content: JSON.parse(content) });
      };

      const handleUpdateLocale = async (
        request: IncomingMessage,
        rawName: string,
        sendJson: SendJson,
      ): Promise<void> => {
        const resolved = resolveLocaleFile(rawName);
        if (!resolved) {
          sendJson(400, { error: "invalid_file" });
          return;
        }

        const readResult = await readBodySafe(request);
        if (!readResult.ok) {
          sendJson(readResult.status, { error: readResult.error });
          return;
        }

        const parsed = parseLocalePayload(readResult.raw);
        if (!parsed.ok) {
          sendJson(parsed.status, { error: parsed.error });
          return;
        }

        await fsPromises.writeFile(
          resolved.filePath,
          `${JSON.stringify(parsed.content, null, 2)}\n`,
          "utf-8",
        );
        sendJson(200, { status: "ok" });
      };

      const isLocalesIndexRequest = (url: URL, method: string) => {
        return method === "GET" && url.pathname === "/api/locales";
      };

      const isLocaleItemRequest = (url: URL) => {
        return url.pathname.startsWith("/api/locales/");
      };

      server.middlewares.use(async (req, res, next) => {
        if (!req.url) {
          next();
          return;
        }

        if (!req.url.startsWith("/api/locales")) {
          next();
          return;
        }

        const url = new URL(req.url, "http://localhost");
        const method = req.method || "GET";
        const sendJson = createSendJson(res);

        try {
          if (isLocalesIndexRequest(url, method)) {
            handleListLocales(sendJson);
            return;
          }

          if (!isLocaleItemRequest(url)) {
            next();
            return;
          }

          const rawName = url.pathname.slice("/api/locales/".length);
          if (method === "GET") {
            await handleGetLocale(rawName, sendJson);
            return;
          }

          if (method === "PUT") {
            await handleUpdateLocale(req, rawName, sendJson);
            return;
          }

          next();
        } catch {
          sendJson(500, { error: "unexpected" });
        }
      });
    },
  };
}
