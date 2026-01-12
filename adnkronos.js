export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/adnkronos") {
      try {
        const key = "adnkronos.json";
        const force = url.searchParams.has("refresh");
        let body = await env.NEWS_CACHE.get(key);

        if (!body || force) {
          const FEED_URL = "https://www.adnkronos.com/NewsFeed/UltimoraNoVideoJson.xml?username=mediaone&password=m3gt67i9gm";
          const res = await fetch(FEED_URL);
          if (!res.ok) throw new Error("upstream " + res.status);
          body = await res.text();
          await env.NEWS_CACHE.put(key, body);
        }

        return new Response(body, {
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
          status: 500,
          headers: { "content-type": "application/json; charset=utf-8" }
        });
      }
    }
    return env.ASSETS.fetch(request, ctx);
  }
};
