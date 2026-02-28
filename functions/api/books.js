export async function onRequestGet() {
  // Your NEW Google Apps Script Web App URL
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyfg_flnVU17m0_A63w3UBkGbViqiTW7X0vNCAqSXKIoSZzHR0Zw-WtoHX_hs4MEXcs/exec";
  
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