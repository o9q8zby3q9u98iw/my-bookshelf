export async function onRequestPost(context) {
  // Your Google Apps Script Web App URL
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwtvcUR-KWiL0JIP2qE-gIweSrDmICQHsmCdnf16Cg0JE8p5jsyQCZdf7t8MZP0eezk/exec";
  
  try {
    const requestData = await context.request.json();
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
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
