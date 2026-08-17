const RESPONSE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff"
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: RESPONSE_HEADERS
  });
}

export async function onRequestGet(context) {
  const GOOGLE_SCRIPT_URL = context.env.GOOGLE_SCRIPT_URL;

  if (!GOOGLE_SCRIPT_URL) {
    console.error("GOOGLE_SCRIPT_URL is not configured");
    return jsonResponse({ error: "Books service unavailable" }, 503);
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL);

    if (!response.ok) {
      throw new Error(`Books service returned status ${response.status}`);
    }

    const data = await response.json();
    return jsonResponse(data);
  } catch (error) {
    console.error("Books data request failed:", error);
    return jsonResponse({ error: "Failed to fetch books" }, 502);
  }
}
