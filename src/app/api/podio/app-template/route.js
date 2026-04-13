import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('appId');

    if (!appId) throw new Error("App ID required in query params");

    const response = await fetch(`https://api.podio.com/app/${appId}`, {
      headers: { 'Authorization': `OAuth2 ${token.podioAccessToken}` },
    });

    if (!response.ok) {
       const err = await response.json();
       throw new Error(err.error_description || "Podio template fetch failed");
    }

    const appData = await response.json();
    return NextResponse.json(appData);
  } catch (error) {
    console.error("Template Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}