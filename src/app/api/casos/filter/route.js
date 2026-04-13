import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

async function getPodioAccessToken(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.podioAccessToken) {
    throw new Error('No Podio Access Token found. Are you logged in?');
  }
  return token.podioAccessToken;
}

export async function POST(req) {
  try {
    const accessToken = await getPodioAccessToken(req);
    const body = await req.json();
    
    // Fallback logic for the App ID
    const appId = body.appId || process.env.PODIO_CASOS_APP_ID; 
    
    if (!appId) throw new Error("No App ID provided to filter route.");

    console.log(`🚀 Mirroring App ID: ${appId}...`);

    const API_URL = `https://api.podio.com/item/app/${appId}/filter/`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `OAuth2 ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filters: body.filters || {},
        limit: body.limit || 50,
        offset: body.offset || 0,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Podio API rejected the request:", errorData);
      return NextResponse.json({ 
        error: "Podio Error", 
        details: errorData.error_description 
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Log success in the terminal
    console.log(`✅ Success: Found ${data.filtered} items for App ${appId}`);

    return NextResponse.json({ 
      items: data.items || [], 
      total: data.filtered || 0 
    });

  } catch (error) {
    console.error("⛔ CRITICAL API ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}