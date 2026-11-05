import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);

function send(response, status, type, body) {
  response.writeHead(status, {
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  });
  response.end(body);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  if (request.method !== "GET") {
    send(response, 405, "application/json; charset=utf-8", JSON.stringify({ error: "Only GET requests are supported." }));
    return;
  }

  if (url.pathname === "/api/feed") {
    const username = url.searchParams.get("username") || "";
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(username)) {
      send(response, 400, "application/json; charset=utf-8", JSON.stringify({ error: "Enter a valid Letterboxd username." }));
      return;
    }

    try {
      const upstream = await fetch(`https://letterboxd.com/${encodeURIComponent(username)}/rss/`, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
          "User-Agent": "ReelRanked/1.0 (public Letterboxd diary reader)"
        },
        signal: AbortSignal.timeout(18000)
      });
      const content = await upstream.text();
      if (!upstream.ok) {
        send(response, upstream.status === 404 ? 404 : 502, "application/json; charset=utf-8", JSON.stringify({
          error: upstream.status === 404
            ? "That username was not found. Check the spelling and try again."
            : "Letterboxd could not provide this public feed right now. Check that the profile is public and try again."
        }));
        return;
      }
      if (!content.includes("<rss") && !content.includes(":rss")) {
        send(response, 502, "application/json; charset=utf-8", JSON.stringify({ error: "Letterboxd did not return a readable RSS feed. The profile may be private or temporarily unavailable." }));
        return;
      }
      send(response, 200, "application/rss+xml; charset=utf-8", content);
    } catch (error) {
      const timeout = error?.name === "TimeoutError" || error?.name === "AbortError";
      send(response, 502, "application/json; charset=utf-8", JSON.stringify({
        error: timeout ? "The Letterboxd feed took too long to respond. Try again." : "Could not connect to Letterboxd. Check your connection and try again."
      }));
    }
    return;
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    try {
      const page = await readFile(join(here, "index.html"));
      send(response, 200, "text/html; charset=utf-8", page);
    } catch {
      send(response, 500, "text/plain; charset=utf-8", "Could not read index.html.");
    }
    return;
  }

  send(response, 404, "text/plain; charset=utf-8", "Not found.");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Reel Ranked is ready at http://127.0.0.1:${port}`);
});
