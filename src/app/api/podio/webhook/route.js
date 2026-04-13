import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const type = formData.get('type');
    const itemId = formData.get('item_id');
    const appId = formData.get('app_id');

    // 1. Verificación obligatoria de Podio
    if (type === 'hook.verify') {
      return new Response(formData.get('code'), { status: 200 });
    }

    // 2. Sincronización al crear o editar
    if (type === 'item.update' || type === 'item.create') {
      const client = await clientPromise;
      const db = client.db("datalink");
      
      // Buscamos el item fresco en Podio
      // Nota: En producción, aquí usaríamos un "App Token" para no depender del login de usuario
      const response = await fetch(`https://api.podio.com/item/${itemId}`, {
        headers: { 
          'Authorization': `OAuth2 ${process.env.PODIO_PERMANENT_TOKEN}` 
        }
      });

      if (response.ok) {
        const item = await response.json();
        await db.collection("mirrored_items").updateOne(
          { item_id: parseInt(itemId) },
          { $set: { ...item, app_id_ref: appId, last_synced: new Date() } },
          { upsert: true }
        );
        console.log(`✅ MongoDB actualizado: Item ${itemId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}