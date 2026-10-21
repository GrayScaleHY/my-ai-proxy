const OPENAI_BASE_URL = "https://api.openai.com";

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  if (!url.pathname.startsWith("/v1/")) {
    return new Response("Not Found", { status: 404 });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  const targetUrl = `${OPENAI_BASE_URL}${url.pathname}${url.search}`;
  const reqHeaders = new Headers(request.headers);
  reqHeaders.delete("host");
  reqHeaders.delete("origin");
  reqHeaders.delete("referer");

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers: reqHeaders,
      body: request.body,
      redirect: "follow",
    });
    const resHeaders = new Headers(res.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");
    return new Response(res.body, { status: res.status, headers: resHeaders });
  } catch (e) {
    return new Response(`Proxy Error: ${e.message}`, { status: 502 });
  }
}
