import type { IncomingMessage } from "http";
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

          const handleEnd = () => resolve(accumulated);
          const handleError = (error: Error) => reject(error);

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

        const filePath = localeFileMap.get(decoded);
        if (!filePath) return null;

        return { name: decoded, filePath } as const;
      };

      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();
        if (!req.url.startsWith("/api/locales")) return next();

        const url = new URL(req.url, "http://localhost");
        const method = req.method || "GET";
        res.setHeader("Content-Type", "application/json; charset=utf-8");

        const sendJson = (status: number, body: unknown) => {
          res.statusCode = status;
          res.end(JSON.stringify(body, null, 2));
        };

        try {
          if (method === "GET" && url.pathname === "/api/locales") {
            const files = Array.from(allowedFiles);
            return sendJson(200, { files });
          }

          if (url.pathname.startsWith("/api/locales/") && method === "GET") {
            const rawName = url.pathname.slice("/api/locales/".length);
            const resolved = resolveLocaleFile(rawName);
            if (!resolved) return sendJson(400, { error: "invalid_file" });
            const { name, filePath } = resolved;
            try {
              await fsPromises.access(filePath, fs.constants.F_OK);
            } catch {
              return sendJson(404, { error: "not_found" });
            }
            const content = await fsPromises.readFile(filePath, "utf-8");
            return sendJson(200, { name, content: JSON.parse(content) });
          }

          if (url.pathname.startsWith("/api/locales/") && method === "PUT") {
            const rawName = url.pathname.slice("/api/locales/".length);
            const resolved = resolveLocaleFile(rawName);
            if (!resolved) return sendJson(400, { error: "invalid_file" });
            const { filePath } = resolved;

            let raw = "";
            try {
              raw = await readRequestBody(req, MAX_BODY_SIZE_BYTES);
            } catch (bodyError) {
              if ((bodyError as Error).message === "payload_too_large") {
                return sendJson(413, { error: "payload_too_large" });
              }
              return sendJson(400, { error: "invalid_body_stream" });
            }

            try {
              const body = JSON.parse(raw || "{}") as { content?: unknown };
              if (!body || typeof body !== "object" || !("content" in body)) {
                return sendJson(400, { error: "invalid_body" });
              }
              await fsPromises.writeFile(
                filePath,
                `${JSON.stringify(body.content, null, 2)}\n`,
                "utf-8",
              );
              return sendJson(200, { status: "ok" });
            } catch {
              return sendJson(400, { error: "invalid_json" });
            }
          }

          return next();
        } catch {
          return sendJson(500, {
            error: "unexpected",
          });
        }
      });
    },
  };
}
