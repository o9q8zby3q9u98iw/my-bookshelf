const MAX_BODY_SIZE = 10_000;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5_000;

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

function requestIsSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!requestIsSameOrigin(request)) {
    return jsonResponse({ success: false, error: "Forbidden" }, 403);
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse({ success: false, error: "JSON request required" }, 415);
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BODY_SIZE) {
    return jsonResponse({ success: false, error: "Request is too large" }, 413);
  }

  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return jsonResponse({ success: false, error: "Request is too large" }, 413);
    }

    const requestData = JSON.parse(rawBody);
    const name = typeof requestData.name === "string" ? requestData.name.trim() : "";
    const email = typeof requestData.email === "string" ? requestData.email.trim() : "";
    const message = typeof requestData.message === "string" ? requestData.message.trim() : "";
    const website = typeof requestData.website === "string" ? requestData.website.trim() : "";

    // Honeypot field: silently accept obvious bot submissions without forwarding them.
    if (website) {
      return jsonResponse({ success: true });
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    const validInput =
      name.length >= 1 &&
      name.length <= MAX_NAME_LENGTH &&
      email.length <= MAX_EMAIL_LENGTH &&
      validEmail &&
      message.length >= 1 &&
      message.length <= MAX_MESSAGE_LENGTH;

    if (!validInput) {
      return jsonResponse({ success: false, error: "Invalid form submission" }, 400);
    }

    if (!env.GOOGLE_SCRIPT_URL) {
      console.error("GOOGLE_SCRIPT_URL is not configured");
      return jsonResponse({ success: false, error: "Contact service unavailable" }, 503);
    }

    const response = await fetch(env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message })
    });

    const rawText = await response.text();
    const normalizedResponse = rawText.trim().toLowerCase();

    if (
      !response.ok ||
      normalizedResponse.includes("error") ||
      normalizedResponse.includes("failed")
    ) {
      throw new Error(`Contact service returned status ${response.status}`);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Contact form submission failed:", error);
    return jsonResponse({ success: false, error: "Failed to send message" }, 502);
  }
}
