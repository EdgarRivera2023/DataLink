'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Helper function to strip HTML for text inputs
function stripHtml(html) {
  if (!html || typeof window === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

export default function EditCasePage({ params }) {
  const [formData, setFormData] = useState({
    title: '',
    proyecto: '',
    estatusDeRecord: '',
    fechaDemanda: '',
    demandante: '',
    tipoDeEmplazamiento: '',
    nombreDemandados: '',
    propiedad: '',
    pueblo2: '',
    finca: '',
    pagareOriginal: '',
    fechaPagareOriginal: '',
    cuantiaDemanda: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { caseId } = params;

  useEffect(() => {
    const fetchCaseData = async () => {
      try {
        const response = await fetch(`/api/casos/${caseId}`);
        if (!response.ok) throw new Error('Failed to fetch case data');
        const data = await response.json();
        
        const getFieldValue = (externalId) => {
          const field = data.fields.find(f => f.external_id === externalId);
          if (!field || !field.values || field.values.length === 0) return '';
          const firstValue = field.values[0];
          if (firstValue.start_date) return firstValue.start_date.split(' ')[0];
          const fieldValue = firstValue.value;
          if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.text) return fieldValue.text;
          if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.title) return fieldValue.title;
          return fieldValue;
        };

        setFormData({
          title: data.title || '',
          proyecto: getFieldValue('proyecto') || '',
          estatusDeRecord: getFieldValue('estatus-de-record') || '',
          fechaDemanda: getFieldValue('fecha-demanda') || '',
          demandante: getFieldValue('demandante') || '',
          tipoDeEmplazamiento: getFieldValue('tipo-de-emplazamiento') || '',
          nombreDemandados: stripHtml(getFieldValue('nombre-demandados')) || '',
          propiedad: stripHtml(getFieldValue('propiedad')) || '',
          pueblo2: getFieldValue('pueblo-2') || '',
          finca: getFieldValue('finca') || '',
          pagareOriginal: getFieldValue('pagare-original') || '',
          fechaPagareOriginal: getFieldValue('fecha-pagare-original') || '',
          cuantiaDemanda: getFieldValue('cuantia-demanda') || '',
        });

      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCaseData();
  }, [caseId]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/casos/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to update case');
      }
      toast.success('Case updated successfully!');
      router.push('/dashboard/casos');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to permanently delete this case?')) {
      setIsDeleting(true);
      try {
        const response = await fetch(`/api/casos/${caseId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete case');
        toast.success('Case deleted successfully');
        router.push('/dashboard/casos');
      } catch (error) {
        toast.error(error.message);
        setIsDeleting(false);
      }
    }
  };
  
  if (isLoading) return <div className="p-8">Loading case data...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Edit Case</h1>
      <div className="mt-8 max-w-4xl">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
              <div><label htmlFor="title" className="block text-sm font-medium text-gray-700">Número Caso</label><input id="title" name="title" type="text" required value={formData.title} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
              <div><label htmlFor="proyecto" className="block text-sm font-medium text-gray-700">Proyecto (Category)</label><input id="proyecto" name="proyecto" type="text" required value={formData.proyecto} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
              <div><label htmlFor="estatusDeRecord" className="block text-sm font-medium text-gray-700">Estatus de Record (Category)</label><input id="estatusDeRecord" name="estatusDeRecord" type="text" required value={formData.estatusDeRecord} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
              <div><label htmlFor="fechaDemanda" className="block text-sm font-medium text-gray-700">Fecha Demanda</label><input id="fechaDemanda" name="fechaDemanda" type="date" required value={formData.fechaDemanda} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
              <div className="sm:col-span-2"><label htmlFor="demandante" className="block text-sm font-medium text-gray-700">Demandante</label><input id="demandante" name="demandante" type="text" required value={formData.demandante} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
              <div><label htmlFor="tipoDeEmplazamiento" className="block text-sm font-medium text-gray-700">Tipo de Emplazamiento (Category)</label><input id="tipoDeEmplazamiento" name="tipoDeEmplazamiento" type="text" required value={formData.tipoDeEmplazamiento} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
              <div className="sm:col-span-2"><label htmlFor="nombreDemandados" className="block text-sm font-medium text-gray-700">Nombre Demandado</label><textarea id="nombreDemandados" name="nombreDemandados" required value={formData.nombreDemandados} onChange={handleInputChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
              <div className="sm:col-span-2"><label htmlFor="propiedad" className="block text-sm font-medium text-gray-700">Dirección de la Propiedad</label><textarea id="propiedad" name="propiedad" required value={formData.propiedad} onChange={handleInputChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
              <div><label htmlFor="pueblo2" className="block text-sm font-medium text-gray-700">Pueblo (Reference)</label><input id="pueblo2" name="pueblo2" type="text" required value={formData.pueblo2} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
              <div><label htmlFor="finca" className="block text-sm font-medium text-gray-700">Finca</label><input id="finca" name="finca" type="text" required value={formData.finca} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
              <div><label htmlFor="pagareOriginal" className="block text-sm font-medium text-gray-700">Pagaré Original (Money)</label><input id="pagareOriginal" name="pagareOriginal" type="number" step="0.01" required value={formData.pagareOriginal} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
              <div><label htmlFor="fechaPagareOriginal" className="block text-sm font-medium text-gray-700">Fecha Pagaré Original</label><input id="fechaPagareOriginal" name="fechaPagareOriginal" type="date" required value={formData.fechaPagareOriginal} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
              <div><label htmlFor="cuantiaDemanda" className="block text-sm font-medium text-gray-700">Cuantía Demanda (Money)</label><input id="cuantiaDemanda" name="cuantiaDemanda" type="number" step="0.01" required value={formData.cuantiaDemanda} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
            </div>
            
            <div className="flex justify-between pt-8 items-center border-t mt-8">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isLoading}
                className="rounded-md bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Case'}
              </button>

              <button
                type="submit"
                disabled={isLoading || isDeleting}
                className="rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
