'use client';
import HtmlRenderer from './HtmlRenderer';

export default function UniversalMirrorTable({ items, fields }) {
  if (!items || items.length === 0) return <p className="p-4 text-gray-500">No hay datos en esta aplicación.</p>;

  return (
    <div className="mt-4 flow-root overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-3.5 text-left text-xs font-bold text-slate-700 uppercase">Item ID</th>
              {fields.map((field) => (
                <th key={field.external_id} className="px-3 py-3.5 text-left text-xs font-bold text-slate-700 uppercase">
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((item) => (
              <tr key={item.item_id} className="hover:bg-slate-50 transition-colors">
                <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-slate-400">{item.item_id}</td>
                {fields.map((field) => {
                  const cellData = item.fields.find(f => f.external_id === field.external_id);
                  const value = cellData?.values?.[0]?.value;
                  
                  return (
                    <td key={field.external_id} className="px-3 py-4 text-sm text-gray-600">
                      {typeof value === 'object' ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                          {value?.title || value?.name || value?.text || 'Object'}
                        </span>
                      ) : (
                        <HtmlRenderer htmlString={String(value || '—')} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}