import type { Plugin, ViteDevServer } from "vite";
import fs from "fs";
import path from "path";

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
      const allowedFiles = new Set(
        fs
          .readdirSync(localesDir)
          .filter((file) => file.endsWith(".json"))
          .map((file) => decodeURIComponent(file)),
      );

      const resolveLocaleFile = (rawPath: string) => {
        if (!rawPath) return null;

        let decoded: string;
        try {
          decoded = decodeURIComponent(rawPath);
        } catch {
          return null;
        }

        if (decoded.includes("/") || decoded.includes("\\")) return null;
        if (!allowedFiles.has(decoded)) return null;

        const filePath = path.resolve(localesDir, decoded);
        if (!filePath.startsWith(localesDirWithSep)) return null;

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
            if (!fs.existsSync(filePath)) {
              return sendJson(404, { error: "not_found" });
            }
            const content = fs.readFileSync(filePath, "utf-8");
            return sendJson(200, { name, content: JSON.parse(content) });
          }

          if (url.pathname.startsWith("/api/locales/") && method === "PUT") {
            const rawName = url.pathname.slice("/api/locales/".length);
            const resolved = resolveLocaleFile(rawName);
            if (!resolved) return sendJson(400, { error: "invalid_file" });
            const { filePath } = resolved;

            let raw = "";
            req.on("data", (chunk) => {
              raw += chunk;
            });
            req.on("end", () => {
              try {
                const body = JSON.parse(raw || "{}") as { content?: unknown };
                if (!body || typeof body !== "object" || !("content" in body)) {
                  return sendJson(400, { error: "invalid_body" });
                }
                fs.writeFileSync(
                  filePath,
                  JSON.stringify(body.content, null, 2) + "\n",
                  "utf-8",
                );
                return sendJson(200, { status: "ok" });
              } catch {
                return sendJson(400, { error: "invalid_json" });
              }
            });
            return; // keep open for body
          }

          return next();
        } catch (err) {
          return sendJson(500, {
            error: "unexpected",
            message: (err as Error).message,
          });
        }
      });
    },
  };
}
