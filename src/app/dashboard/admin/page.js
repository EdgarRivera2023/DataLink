'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPanel() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [syncingId, setSyncingId] = useState(null); // Track which app is syncing

  // 1. Discover the 32 apps from Podio
  useEffect(() => {
    async function discover() {
      const res = await fetch('/api/podio/workspace-apps');
      const data = await res.json();
      setApps(data);
      setLoading(false);
    }
    discover();
  }, []);

  // 2. The Sync Logic (Step 2)
  const handleSync = async (appId, appName) => {
    setSyncingId(appId);
    try {
      const res = await fetch('/api/podio/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, appName })
      });
      const result = await res.json();
      if (result.success) {
        alert(`✅ ¡Éxito! ${result.count} items de "${appName}" están ahora en la nube.`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      alert("❌ Error crítico en la conexión.");
    } finally {
      setSyncingId(null);
    }
  };

  const filteredApps = apps.filter(app => app.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight">MIRROR BACKDOOR</h1>
          <p className="text-slate-500 font-medium">{apps.length} Apps detectadas.</p>
        </div>
        <input 
          type="text" 
          placeholder="Buscar aplicación..." 
          className="rounded-lg border-slate-300 shadow-sm focus:ring-indigo-500 w-64 p-2"
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      {loading ? (
        <div className="grid grid-cols-4 gap-4 animate-pulse">
          {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredApps.map((app) => (
            <div key={app.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <Link href={`/dashboard/admin/mirror/${app.id}`} className="group">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{app.item_name}</span>
                <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 truncate mb-4">{app.name}</h3>
              </Link>

              <button 
                onClick={() => handleSync(app.id, app.name)}
                disabled={syncingId === app.id}
                className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                  syncingId === app.id 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                }`}
              >
                {syncingId === app.id ? '⏳ Sincronizando...' : '☁️ Sincronizar con Nube'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}