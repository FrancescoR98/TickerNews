export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.has('refresh');
    
    const FEED_URL = 'https://www.adnkronos.com/NewsFeed/UltimoraNoVideoJson.xml?username=mediaone&password=m3gt67i9gm';
    const apiRes = await fetch(FEED_URL);
    
    if (!apiRes.ok) throw new Error(`Adnkronos ${apiRes.status}`);
    
    const xmlText = await apiRes.text();
    
    // Estrae titoli: <title>News reale</title> (max 6)
    const titleMatches = [...xmlText.matchAll(/<title>(?!.*ultimoranovideo)([^<]{10,})<\/title>/gi)]
      .map(m => m[1].trim())
      .filter(t => t.length > 5)
      .slice(0, 6);
    
    return new Response(JSON.stringify(titleMatches), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=10800'  // 3h cache
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
