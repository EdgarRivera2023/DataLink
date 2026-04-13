// src/app/dashboard/casos/[caseId]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import CasoForm from '@/components/CasoForm';

const transformPodioItemToFormData = (podioItem) => {
  const formData = {};
  if (!podioItem || !podioItem.fields) return formData;
  for (const field of podioItem.fields) {
    const { external_id, type, values } = field;
    if (!values || values.length === 0) continue;
    switch (type) {
      case 'date':
        formData[external_id] = values[0].start_date;
        break;
      case 'category':
        formData[external_id] = values[0].value.id;
        break;
      case 'app':
        const isMulti = field.config.settings.multiple;
        if (isMulti) {
          formData[external_id] = values.map(v => ({ value: v.value.item_id, label: v.value.title }));
        } else {
          formData[external_id] = { value: values[0].value.item_id, label: values[0].value.title };
        }
        break;
      default:
        formData[external_id] = values[0].value;
        break;
    }
  }
  return formData;
};

export default function EditCasoPage({ params }) {
  const { caseId } = params;
  const [appTemplate, setAppTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templateRes, itemRes] = await Promise.all([
          fetch('/api/podio/app-template'),
          fetch(`/api/casos/${caseId}`),
        ]);
        if (!templateRes.ok) throw new Error('Failed to fetch app template');
        if (!itemRes.ok) throw new Error('Failed to fetch case data');
        const templateData = await templateRes.json();
        const itemData = await itemRes.json();
        setAppTemplate(templateData);
        setFormData(transformPodioItemToFormData(itemData));
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [caseId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // ... (logic to format data before sending)
    const formattedData = { ...formData };
    for (const key in formattedData) {
        const value = formattedData[key];
        if (value && typeof value === 'object' && !Array.isArray(value) && value.hasOwnProperty('value')) {
            formattedData[key] = value.value;
        } else if (Array.isArray(value)) {
            formattedData[key] = value.map(item => item.value);
        }
    }

    try {
      const response = await fetch(`/api/casos/${caseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });
      if (!response.ok) throw new Error('Failed to update case');
      toast.success('Case updated successfully!');
      router.push('/dashboard/casos');
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading case data...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <CasoForm
      appTemplate={appTemplate}
      formData={formData}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      pageTitle="Edit Case"
      caseId={caseId}
    />
  );
}
