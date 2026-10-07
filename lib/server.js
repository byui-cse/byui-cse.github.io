/**
 * Minimal static file server + SSE live reload.
 */
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
    ".map": "application/json; charset=utf-8"
};

const LIVE_PATH = "/__livereload";

/**
 * @param {string} rootDir www root
 * @param {string} requestPath
 */
const resolveSafePath = (rootDir, requestPath) => {
    const decoded = decodeURIComponent(requestPath.split("?")[0]);
    const cleaned = decoded.replace(/^\/+/, "");
    const candidate = path.resolve(rootDir, cleaned);
    const root = path.resolve(rootDir);
    const rel = path.relative(root, candidate);

    if (rel.startsWith("..") || path.isAbsolute(rel)) {
        return null;
    }

    return candidate;
};

/**
 * @param {object} options
 * @param {string} options.root
 * @param {string} options.host
 * @param {number} options.port
 */
export const startStaticServer = async ({ root, host, port }) => {
    /** @type {Set<import('node:http').ServerResponse>} */
    const liveClients = new Set();

    const server = http.createServer(async (req, res) => {
        try {
            const urlPath = (req.url ?? "/").split("?")[0];

            if (urlPath === LIVE_PATH) {
                req.socket.setTimeout(0);
                res.writeHead(200, {
                    "Content-Type": "text/event-stream; charset=utf-8",
                    "Cache-Control": "no-cache, no-transform",
                    Connection: "keep-alive",
                    "X-Accel-Buffering": "no"
                });
                res.write(": connected\n\n");
                liveClients.add(res);

                const heartbeat = setInterval(() => {
                    if (res.writableEnded) {
                        clearInterval(heartbeat);
                        return;
                    }

                    res.write(": ping\n\n");
                }, 15000);

                const cleanup = () => {
                    clearInterval(heartbeat);
                    liveClients.delete(res);
                };

                req.on("close", cleanup);
                res.on("close", cleanup);
                return;
            }

            let filePath = resolveSafePath(root, urlPath);

            if (!filePath) {
                res.writeHead(403).end("Forbidden");
                return;
            }

            let stat;

            try {
                stat = await fs.stat(filePath);
            } catch {
                res.writeHead(404).end("Not found");
                return;
            }

            if (stat.isDirectory()) {
                filePath = path.join(filePath, "index.html");

                try {
                    stat = await fs.stat(filePath);
                } catch {
                    res.writeHead(404).end("Not found");
                    return;
                }
            }

            const data = await fs.readFile(filePath);
            const type = TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
            res.writeHead(200, {
                "Content-Type": type,
                "Cache-Control": "no-store"
            });
            res.end(data);
        } catch (err) {
            console.error(err);
            if (!res.headersSent) {
                res.writeHead(500).end("Server error");
            }
        }
    });

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
            server.off("error", reject);
            resolve();
        });
    });

    console.log(`Server Live: http://${host}:${port}/`);

    /**
     * @param {string} message
     */
    const broadcast = (message) => {
        const payload = `data: ${message}\n\n`;

        for (const client of [...liveClients]) {
            try {
                client.write(payload);
            } catch {
                liveClients.delete(client);
            }
        }
    };

    return { server, broadcast };
};
