// src/app/dashboard/casos/new/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import CasoForm from '@/components/CasoForm';

export default function NewCasoPage() {
  const [appTemplate, setAppTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAppTemplate = async () => {
      try {
        const response = await fetch('/api/podio/app-template');
        if (!response.ok) throw new Error('Failed to fetch app template');
        const data = await response.json();
        setAppTemplate(data);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppTemplate();
  }, []);

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
      const response = await fetch('/api/casos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });
      if (!response.ok) throw new Error('Failed to create case');
      toast.success('Case created successfully!');
      router.push('/dashboard/casos');
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading form...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <CasoForm
      appTemplate={appTemplate}
      formData={formData}
      handleInputChange={handleInputChange}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      pageTitle="Añadir Nuevo Caso"
    />
  );
}
