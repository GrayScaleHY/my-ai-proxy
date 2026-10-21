// OpenAI API 透明反向代理 - Cloudflare Pages _worker.js 版
const OPENAI_BASE_URL = "https://api.openai.com";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 仅放行 /v1 开头的官方API路径，其他路径返回404
    if (!url.pathname.startsWith("/v1/")) {
      return new Response("Not Found", { status: 404 });
    }

    // 处理跨域预检请求
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

    // 构造目标请求地址，完整保留路径与查询参数
    const targetUrl = `${OPENAI_BASE_URL}${url.pathname}${url.search}`;

    // 清洗请求头，移除易触发风控的标识
    const reqHeaders = new Headers(request.headers);
    reqHeaders.delete("host");
    reqHeaders.delete("origin");
    reqHeaders.delete("referer");
    reqHeaders.delete("cf-connecting-ip");
    reqHeaders.delete("cf-ray");

    try {
      // 透明转发请求，原生支持流式响应
      const upstreamResponse = await fetch(targetUrl, {
        method: request.method,
        headers: reqHeaders,
        body: request.body,
        redirect: "follow",
      });

      // 处理响应头，添加跨域支持
      const resHeaders = new Headers(upstreamResponse.headers);
      resHeaders.set("Access-Control-Allow-Origin", "*");
      resHeaders.set("Access-Control-Allow-Credentials", "true");
      resHeaders.delete("alt-svc");

      // 返回完整响应
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: resHeaders,
      });
    } catch (error) {
      return new Response(`Proxy Error: ${error.message}`, { status: 502 });
    }
  },
};
