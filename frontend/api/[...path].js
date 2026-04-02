const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function getBackendOrigin() {
  const configuredOrigin = process.env.BACKEND_API_ORIGIN?.trim();

  if (!configuredOrigin) {
    throw new Error('BACKEND_API_ORIGIN is not configured.');
  }

  return configuredOrigin.endsWith('/api')
    ? configuredOrigin.slice(0, -4).replace(/\/+$/, '')
    : configuredOrigin.replace(/\/+$/, '');
}

function buildTargetUrl(requestUrl) {
  const incomingUrl = new URL(requestUrl);
  const backendOrigin = getBackendOrigin();
  const forwardedPath = incomingUrl.pathname.replace(/^\/api/, '') || '';
  return `${backendOrigin}/api${forwardedPath}${incomingUrl.search}`;
}

function copyRequestHeaders(request) {
  const headers = new Headers();

  for (const [key, value] of request.headers.entries()) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  return headers;
}

function copyResponseHeaders(response) {
  const headers = new Headers();

  for (const [key, value] of response.headers.entries()) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  return headers;
}

async function forward(request) {
  let targetUrl;

  try {
    targetUrl = buildTargetUrl(request.url);
  } catch (error) {
    return Response.json(
      {
        error: 'Backend proxy is not configured.',
        message: error instanceof Error ? error.message : 'Unknown proxy configuration error.',
      },
      { status: 500 },
    );
  }

  const headers = copyRequestHeaders(request);
  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();

  const upstreamResponse = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: 'manual',
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: copyResponseHeaders(upstreamResponse),
  });
}

export default {
  fetch: forward,
};
