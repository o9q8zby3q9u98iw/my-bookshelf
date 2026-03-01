export async function onRequestPost(context) {
  // Pulled securely from Cloudflare Environment Variables
  const GOOGLE_SCRIPT_URL = context.env.GOOGLE_SCRIPT_URL;
  
  try {
    const requestData = await context.request.json();
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    const rawText = await response.text(); 
    
    return new Response(rawText, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to send message" }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}
