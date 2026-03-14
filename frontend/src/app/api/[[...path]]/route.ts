
const BACKEND_BASE = "http://127.0.0.1:8000";

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await context.params;
  if (path.length === 1 && path[0] === "ping") {
    return Response.json({ ok: true, source: "next-api-route" });
  }
  return proxy(request, context, "GET");
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, context, "POST");
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, context, "PUT");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, context, "PATCH");
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  return proxy(request, context, "DELETE");
}

async function proxy(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
  method: string
) {
  const { path = [] } = await context.params;
  const pathStr = path.length > 0 ? path.join("/") : "";
  const url = new URL(request.url);
  const backendUrl = `${BACKEND_BASE}/api/${pathStr}${url.search}`;

  const headers: HeadersInit = {};
  request.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k !== "host" && k !== "connection" && k !== "content-length") {
      headers[key] = value;
    }
  });

  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD" && request.body) {
    body = await request.text();
  }

  try {
    const res = await fetch(backendUrl, { method, headers, body });

    const resHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k !== "content-encoding" && k !== "transfer-encoding") {
        resHeaders.set(key, value);
      }
    });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (err) {
    console.error("[api proxy]", method, backendUrl, err);
    return new Response(
      JSON.stringify({
        detail: "Backend indisponible. Réessayez plus tard.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
