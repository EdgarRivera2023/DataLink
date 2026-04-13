export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { appId, appName } = await req.json();

    const client = await clientPromise;
    const db = client.db("datalink");
    const collection = db.collection("mirrored_items");

    let offset = 0;
    const limit = 500;
    let totalSynced = 0;
    let hasMore = true;

    console.log(`🚀 Iniciando Sincronización Profunda: ${appName}`);

    while (hasMore) {
      const podioRes = await fetch(`https://api.podio.com/item/app/${appId}/filter/`, {
        method: 'POST',
        headers: {
          'Authorization': `OAuth2 ${token.podioAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ limit, offset })
      });

      const data = await podioRes.json();
      const items = data.items || [];

      if (items.length === 0) {
        hasMore = false;
        break;
      }

      // Guardar lote en MongoDB
      const operations = items.map(item => ({
        updateOne: {
          filter: { item_id: item.item_id },
          update: { $set: { ...item, app_id_ref: appId, last_synced: new Date() } },
          upsert: true
        }
      }));

      await collection.bulkWrite(operations);
      
      totalSynced += items.length;
      offset += limit;
      console.log(`📦 Sincronizados ${totalSynced} de ${data.filtered || '?'}`);

      // Si ya trajimos todos los que Podio dice tener, paramos.
      if (totalSynced >= data.filtered) hasMore = false;
    }

    return NextResponse.json({ success: true, count: totalSynced });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}