const browserUserAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function isOlxListingUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    const isHttps = url.protocol === "https:";
    const host = url.hostname.toLowerCase();
    const isOlxHost = host === "olx.com.br" || host.endsWith(".olx.com.br");
    return isHttps && isOlxHost;
  } catch {
    return false;
  }
}

Deno.serve(async function handleImport(request) {
  const isPreflight = request.method === "OPTIONS";
  if (isPreflight) {
    return new Response("ok", { headers: corsHeaders });
  }

  const body: unknown = await request.json();
  const pageUrl = body && typeof body === "object" && "url" in body && typeof body.url === "string" ? body.url : "";
  const isAllowed = isOlxListingUrl(pageUrl);
  if (!isAllowed) {
    return new Response("Niedozwolony adres", { status: 400, headers: corsHeaders });
  }

  const olxResponse = await fetch(pageUrl, {
    headers: {
      "User-Agent": browserUserAgent,
      Accept: "text/html",
      "Accept-Language": "pt-BR,pt;q=0.9",
    },
  });
  const html = await olxResponse.text();
  const status = olxResponse.ok ? 200 : 502;

  return new Response(html, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
});
