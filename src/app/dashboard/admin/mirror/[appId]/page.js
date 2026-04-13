'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import UniversalMirrorTable from '@/components/UniversalMirrorTable';

export default function MirrorPage({ params }) {
  const { appId } = params;
  const [data, setData] = useState({ items: [], fields: [] });
  const [loading, setLoading] = useState(true);
  const [appName, setAppName] = useState('Cargando...');

  useEffect(() => {
    async function syncMirror() {
      try {
        // 1. Fetch the Blueprint (Template) and the Data (Items) in parallel
        const [templateRes, dataRes] = await Promise.all([
          fetch(`/api/podio/app-template?appId=${appId}`),
          fetch('/api/casos/filter', {
            method: 'POST',
            body: JSON.stringify({ appId: appId, limit: 100 })
          })
        ]);

        const template = await templateRes.json();
        const itemsResult = await dataRes.json();

        setAppName(template.config?.name || appId);
        
        setData({
          // Map fields from the template so the table always has headers
          fields: template.fields.filter(f => f.status === 'active').map(f => ({
            label: f.config.label,
            external_id: f.external_id
          })),
          items: itemsResult.items || []
        });

      } catch (err) {
        console.error("Sync Error:", err);
      } finally {
        setLoading(false);
      }
    }
    syncMirror();
  }, [appId]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <Link href="/dashboard/admin" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2">
          ← VOLVER AL PANEL DE ADMINISTRACIÓN
        </Link>
        <h1 className="text-4xl font-black mt-4 text-slate-900 uppercase tracking-tighter">
          ESPEJO: <span className="text-indigo-600">{appName}</span>
        </h1>
        <p className="text-slate-500 font-mono text-xs mt-1">PODIO_APP_ID: {appId}</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-r-4 border-transparent mb-4"></div>
          <p className="text-slate-400 font-bold animate-pulse">SINCRONIZANDO CON PODIO...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
           <UniversalMirrorTable items={data.items} fields={data.fields} />
        </div>
      )}
    </div>
  );
}