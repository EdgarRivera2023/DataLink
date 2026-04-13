import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const spaceId = process.env.PODIO_WORKSPACE_ID;

    // Fetch all apps in the specific workspace (Space)
    const response = await fetch(`https://api.podio.com/app/space/${spaceId}/`, {
      headers: { 'Authorization': `OAuth2 ${token.podioAccessToken}` }
    });

    if (!response.ok) throw new Error('Failed to fetch workspace apps');

    const apps = await response.json();
    
    // Clean and sort the list for the UI
    const sortedApps = apps.sort((a, b) => a.config.name.localeCompare(b.config.name));

    return NextResponse.json(sortedApps.map(app => ({
      id: app.app_id,
      name: app.config.name,
      item_name: app.config.item_name,
      icon: app.config.icon,
    })));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}