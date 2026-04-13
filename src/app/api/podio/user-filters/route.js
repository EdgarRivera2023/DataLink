// src/app/api/podio/user-filters/route.js
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

async function getPodioAccessToken(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.podioAccessToken) {
    throw new Error('Podio access token not found.');
  }
  return token; // Return the full token
}

export async function GET(req) {
  try {
    const token = await getPodioAccessToken(req);
    const accessToken = token.podioAccessToken;
    const userId = token.sub; // The user's Item ID from the Staff App is in token.sub

    if (!userId) {
        throw new Error('User ID not found in session token.');
    }

    const filtrosAppId = process.env.PODIO_FILTROS_APP_ID;
    const userFieldId = process.env.PODIO_FILTROS_USER_FIELD_ID;

    const API_URL = `https://api.podio.com/item/app/${filtrosAppId}/filter/`;

    const requestBody = {
      filters: {
        // This is the key part: we are filtering by the "Usuario Asignado" field
        [userFieldId]: [parseInt(userId, 10)]
      }
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `OAuth2 ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Podio API request failed: ${errorData.error_description}`);
    }
    
    const data = await response.json();
    
    // We need to re-format the filters into a clean structure for the frontend
    const findField = (item, externalId) => item.fields.find(f => f.external_id === externalId);

    const userFilters = data.items.map(item => {
        const proyectoField = findField(item, 'proyecto');
        const queryField = findField(item, 'consulta-podio-json');
        const tipoField = findField(item, 'tipo-de-filtro');

        return {
            id: item.item_id,
            name: item.title,
            proyecto: proyectoField?.values[0]?.value?.text || null,
            proyecto_id: proyectoField?.values[0]?.value?.id || null,
            query: queryField ? JSON.parse(queryField.values[0].value) : {},
            type: tipoField?.values[0]?.value?.text || 'Personalizado'
        };
    });

    return NextResponse.json(userFilters);

  } catch (error) {
    console.error("--- CATCH BLOCK ERROR in /api/podio/user-filters ---", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}