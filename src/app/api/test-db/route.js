import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("datalink");

    // Try to perform a tiny operation (Ping the database)
    const result = await db.command({ ping: 1 });

    return NextResponse.json({ 
      status: "online", 
      message: "🚀 Jarvis is officially connected to the Cloud Brain!",
      ping: result 
    });
  } catch (error) {
    console.error("❌ Database Connection Failed:", error);
    return NextResponse.json({ 
      status: "offline", 
      error: error.message 
    }, { status: 500 });
  }
}