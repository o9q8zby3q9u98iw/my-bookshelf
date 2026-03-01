export async function onRequestGet(context) {
  // Pulled securely from Cloudflare Environment Variables
  const GOOGLE_SCRIPT_URL = context.env.GOOGLE_SCRIPT_URL;
  
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL);
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch books" }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}
