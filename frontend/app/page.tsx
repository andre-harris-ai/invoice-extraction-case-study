'use client';

import { useState, useEffect } from 'react';

interface LineItem {
  description?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
}

interface InvoiceData {
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  billing_address?: string;
  shipping_address?: string;
  vendor_name?: string;
  customer_name?: string;
  line_items?: LineItem[];
  subtotal?: number;
  tax?: number;
  total_amount?: number;
  currency?: string;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState<number>(0);
  const [selectedPage, setSelectedPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [editedData, setEditedData] = useState<InvoiceData | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [rawJsonResponse, setRawJsonResponse] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [databaseInvoices, setDatabaseInvoices] = useState<any[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (invoiceData) {
      setEditedData({ ...invoiceData });
      setShowBeforeAfter(true);
    }
  }, [invoiceData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setInvoiceData(null);
    setEditedData(null);
    setRawOcrText(null);
    setRawJsonResponse(null);
    setShowBeforeAfter(false);
    setCurrentStepIndex(-1);
    setProgressStep('');
    setProgressPercent(0);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setPdfPages(0);
    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // Show PDF preview placeholder
      setImagePreview(null);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch(`${API_URL}/api/pdf-info`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          setPdfPages(data.total_pages);
          setSelectedPage(0);
        } else {
          setError('Failed to read PDF file. Please ensure it is a valid PDF.');
        }
      } catch (err) {
        console.error('Error getting PDF info:', err);
        setError('Error reading PDF file. Please try again.');
      }
    } else {
      setError('Unsupported file type. Please upload a PDF, PNG, JPG, or JPEG file.');
      setSelectedFile(null);
      setImagePreview(null);
      setPdfPages(0);
    }
  };

  const handleExtract = async () => {
    setLoading(true);
    setError(null);
    setInvoiceData(null);
    setEditedData(null);
    setRawOcrText(null);
    setRawJsonResponse(null);
    setShowBeforeAfter(false);
    setSavedOrderId(null);
    setProgressStep('Initializing extraction...');
    setProgressPercent(0);

    try {
      if (!selectedFile) {
        setError('Please select a file');
        setLoading(false);
        setProgressStep('');
        setProgressPercent(0);
        return;
      }

      // Define extraction steps
      const extractionSteps = [
        { id: 0, label: 'Upload Received', icon: 'upload' },
        { id: 1, label: 'Text Extracted', icon: 'document' },
        { id: 2, label: 'AI Processing', icon: 'ai' },
        { id: 3, label: 'Normalizing', icon: 'normalize' },
        { id: 4, label: 'Validated', icon: 'validate' },
        { id: 5, label: 'Complete', icon: 'complete' },
      ];

      // Step 1: Upload Received
      setCurrentStepIndex(0);
      setProgressStep('Upload Received');
      setProgressPercent(10);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Step 2: Text Extracted (OCR)
      setCurrentStepIndex(1);
      setProgressStep('Text Extracted');
      setProgressPercent(25);
      await new Promise(resolve => setTimeout(resolve, 500));

      const formData = new FormData();
      formData.append('input_method', 'upload');
      formData.append('file', selectedFile);
      formData.append('page_number', selectedPage.toString());

      // Step 3: AI Processing
      setCurrentStepIndex(2);
      setProgressStep('AI Processing');
      setProgressPercent(50);

      const response = await fetch(`${API_URL}/api/extract`, {
        method: 'POST',
        body: formData,
      });

      // Step 4: Normalizing
      setCurrentStepIndex(3);
      setProgressStep('Normalizing');
      setProgressPercent(75);
      await new Promise(resolve => setTimeout(resolve, 300));

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract invoice data');
      }

      if (data.success) {
        // Step 5: Validated
        setCurrentStepIndex(4);
        setProgressStep('Validated');
        setProgressPercent(90);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Animate data appearance
        await new Promise(resolve => setTimeout(resolve, 200));
        setRawOcrText(data.raw_ocr_text || null);
        await new Promise(resolve => setTimeout(resolve, 200));
        setRawJsonResponse(data.raw_json_response || null);
        await new Promise(resolve => setTimeout(resolve, 200));
        setInvoiceData(data.data);
        
        // Step 6: Complete
        setCurrentStepIndex(5);
        setProgressStep('Complete');
        setProgressPercent(100);
        
        setTimeout(() => {
          setProgressStep('');
          setProgressPercent(0);
          setCurrentStepIndex(-1);
        }, 1500);
      } else {
        throw new Error('Extraction failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProgressStep('');
      setProgressPercent(0);
      setCurrentStepIndex(-1);
    } finally {
      setLoading(false);
    }
  };

  const sanitizeNumber = (value: any): number | null => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num)) {
      return null;
    }
    return num;
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!editedData) return;
    
    if (field.startsWith('line_item_')) {
      const [_, index, subField] = field.split('_');
      const idx = parseInt(index);
      const newLineItems = [...(editedData.line_items || [])];
      if (!newLineItems[idx]) {
        newLineItems[idx] = {};
      }
      newLineItems[idx] = {
        ...newLineItems[idx],
        [subField]: subField === 'quantity' || subField === 'unit_price' || subField === 'total_price' 
          ? sanitizeNumber(value)
          : value
      };
      setEditedData({ ...editedData, line_items: newLineItems });
    } else {
      const valueToSet = ['subtotal', 'tax', 'total_amount'].includes(field)
        ? sanitizeNumber(value)
        : value;
      setEditedData({ ...editedData, [field]: valueToSet });
    }
  };

  const sanitizeDataForSave = (data: InvoiceData): any => {
    const sanitize = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return null;
      }
      if (typeof obj === 'number') {
        return isNaN(obj) || !isFinite(obj) ? null : obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          const value = obj[key];
          if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
            sanitized[key] = null;
          } else {
            sanitized[key] = sanitize(value);
          }
        }
        return sanitized;
      }
      return obj;
    };
    return sanitize(data);
  };

  const handleSave = async () => {
    if (!editedData) return;

    setSaving(true);
    setError(null);

    try {
      // Sanitize data to remove NaN values
      const sanitizedData = sanitizeDataForSave(editedData);
      
      const response = await fetch(`${API_URL}/api/save-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save invoice');
      }

      if (data.success) {
        setSavedOrderId(data.order_id);
        setShowSuccessAlert(true);
        await loadDatabaseInvoices();
        
        // Auto-hide success alert after 5 seconds
        setTimeout(() => {
          setShowSuccessAlert(false);
        }, 5000);
      } else {
        throw new Error(data.error || 'Save failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const loadDatabaseInvoices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/get-invoices`);
      const data = await response.json();
      if (data.success) {
        setDatabaseInvoices(data.headers || []);
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
    }
  };

  useEffect(() => {
    loadDatabaseInvoices();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Professional Header */}
          <div className="text-center mb-10 sm:mb-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 mb-6 shadow-2xl shadow-blue-500/25 dark:shadow-blue-500/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <span className="text-5xl sm:text-6xl relative z-10 transform group-hover:scale-110 transition-transform duration-300">🧾</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 mb-4 tracking-tight">
              Invoice Parser
            </h1>
            <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 font-semibold mb-2">
              Intelligent extraction powered by LLaMA 4
            </p>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">
              SalesOrder Database Integration • Multilingual Support
            </p>
          </div>

          {/* Upload Section - Professional Card */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 sm:p-8 lg:p-10 mb-8 animate-slide-up relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-indigo-950/20"></div>
            <div className="max-w-2xl mx-auto relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <label className="block text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                  Upload Invoice Document
                </label>
              </div>
              
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf,application/pdf,image/png,image/jpeg,image/jpg"
                  onChange={handleFileChange}
                  className="relative block w-full text-sm text-slate-600 dark:text-slate-400
                    file:mr-4 file:py-3.5 file:px-7
                    file:rounded-xl file:border-0
                    file:text-sm file:font-bold
                    file:bg-gradient-to-r file:from-blue-600 file:to-indigo-600
                    file:text-white
                    hover:file:from-blue-700 hover:file:to-indigo-700
                    file:transition-all file:duration-300
                    file:cursor-pointer
                    file:shadow-lg file:hover:shadow-xl file:hover:scale-105
                    file:active:scale-95
                    cursor-pointer
                    bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300"
                />
              </div>

              {pdfPages > 1 && (
                <div className="mt-6 animate-fade-in">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Select Page
                  </label>
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(Number(e.target.value))}
                    className="w-full px-5 py-3.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
                  >
                    {Array.from({ length: pdfPages }, (_, i) => (
                      <option key={i} value={i}>
                        Page {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedFile && (
                <div className="mt-6 space-y-4">
                  {/* Step-by-Step Progress Indicator */}
                  {loading && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-8 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Extraction Progress
                      </h3>
                      <div className="relative">
                        {/* Progress Steps */}
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          {[
                            { id: 0, label: 'Upload Received', icon: 'upload' },
                            { id: 1, label: 'Text Extracted', icon: 'document' },
                            { id: 2, label: 'AI Processing', icon: 'ai' },
                            { id: 3, label: 'Normalizing', icon: 'normalize' },
                            { id: 4, label: 'Validated', icon: 'validate' },
                            { id: 5, label: 'Complete', icon: 'complete' },
                          ].map((step, index) => {
                            const isCompleted = currentStepIndex > step.id;
                            const isActive = currentStepIndex === step.id;
                            const isPending = currentStepIndex < step.id;

                            return (
                              <div key={step.id} className="flex items-start flex-1 min-w-0">
                                <div className="flex flex-col items-center w-full">
                                  {/* Step Icon */}
                                  <div className={`relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                                    isCompleted 
                                      ? 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/50 scale-110' 
                                      : isActive 
                                      ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/50 scale-110' 
                                      : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500'
                                  }`}>
                                    {isCompleted ? (
                                      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : step.icon === 'upload' ? (
                                      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                      </svg>
                                    ) : step.icon === 'document' ? (
                                      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    ) : step.icon === 'ai' ? (
                                      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                      </svg>
                                    ) : step.icon === 'normalize' ? (
                                      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                    ) : step.icon === 'validate' ? (
                                      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                    {isActive && (
                                      <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
                                    )}
                                  </div>
                                  {/* Step Label */}
                                  <div className="mt-4 text-center w-full">
                                    <p className={`text-xs sm:text-sm font-bold transition-all duration-300 ${
                                      isCompleted 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : isActive 
                                        ? 'text-blue-600 dark:text-blue-400' 
                                        : 'text-slate-400 dark:text-slate-500'
                                    }`}>
                                      {step.label}
                                    </p>
                                  </div>
                                </div>
                                {/* Connector Line */}
                                {index < 5 && (
                                  <div className={`flex-1 h-1 sm:h-1.5 mt-7 sm:mt-8 mx-1 sm:mx-2 rounded-full transition-all duration-500 ${
                                    isCompleted 
                                      ? 'bg-green-500' 
                                      : currentStepIndex > step.id
                                      ? 'bg-green-300 dark:bg-green-700'
                                      : 'bg-slate-200 dark:bg-slate-700'
                                  }`}></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleExtract}
                    disabled={loading}
                    className="group relative w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:via-slate-500 disabled:to-slate-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 relative z-10" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="relative z-10">Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 relative z-10 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="relative z-10">Extract Invoice Data</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-l-4 border-red-500 rounded-2xl p-5 mb-6 shadow-xl animate-slide-up backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-800 dark:text-red-200 mb-1">Error</h3>
                  <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Alert - Fixed Position Toast */}
          {showSuccessAlert && savedOrderId && (
            <div className="fixed top-4 right-4 z-50 animate-slide-up max-w-md">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-5 shadow-2xl border-2 border-green-400 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Success!</h3>
                    <p className="text-white/90 font-medium">
                      Invoice saved successfully to Excel database
                    </p>
                    <p className="text-white/80 text-sm mt-1">
                      OrderID: <span className="font-bold">{savedOrderId}</span>
          </p>
        </div>
                  <button
                    onClick={() => setShowSuccessAlert(false)}
                    className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {showBeforeAfter && editedData && invoiceData && (
            <div className="space-y-8 mb-8 animate-fade-in">
              {/* Image Preview or PDF Info */}
              {(imagePreview || (selectedFile && pdfPages > 0)) && (
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 sm:p-8 animate-scale-in">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                      {pdfPages > 0 ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200">
                      {pdfPages > 0 ? 'PDF Document' : 'Original Invoice'}
                    </h2>
                  </div>
                  {imagePreview ? (
                    <div className="relative w-full border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-6 shadow-inner">
                      <img
                        src={imagePreview}
                        alt="Invoice preview"
                        className="w-full h-auto object-contain max-h-96 mx-auto rounded-xl shadow-2xl"
                      />
                    </div>
                  ) : pdfPages > 0 ? (
                    <div className="relative w-full border-2 border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-8 shadow-inner">
                      <div className="flex flex-col items-center justify-center text-center">
                        <svg className="w-20 h-20 text-blue-500 dark:text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          {selectedFile?.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          PDF Document • {pdfPages} page{pdfPages !== 1 ? 's' : ''} total
                        </p>
                        {pdfPages > 1 && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Currently processing page {selectedPage + 1} of {pdfPages}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end animate-fade-in">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="group relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 disabled:from-slate-400 disabled:via-slate-500 disabled:to-slate-500 text-white font-bold py-3.5 px-8 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:shadow-none disabled:scale-100 flex items-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 relative z-10" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="relative z-10">Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 relative z-10 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="relative z-10">Save to Excel Database</span>
                    </>
                  )}
                </button>
              </div>

              {/* Before and After Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* BEFORE EXTRACTION */}
                <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-blue-50/90 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-blue-950/40 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border-2 border-blue-200/60 dark:border-blue-800/60 relative overflow-hidden animate-scale-in">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xl">
                          BEFORE EXTRACTION
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold hidden sm:inline">Raw OCR + LLM</span>
                      </div>
                    </div>

                  {/* Raw OCR Text */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <span className="text-xl">📝</span>
                        Raw OCR Text
                      </h3>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">From OCR Processing</span>
                    </div>
                    <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-5 border-2 border-blue-300/50 dark:border-blue-700/50 shadow-2xl">
                      <pre className="text-xs sm:text-sm text-green-400 font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-slate-800">
                        {rawOcrText || 'No OCR text available'}
                      </pre>
                    </div>
                  </div>

                  {/* Raw JSON Response */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 dark:bg-blue-400/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                        </div>
                        Raw JSON Response
                      </h3>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">LLM Output</span>
                    </div>
                    <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-5 border-2 border-blue-300/50 dark:border-blue-700/50 shadow-2xl">
                      <pre className="text-xs sm:text-sm text-cyan-400 font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-cyan-600 scrollbar-track-slate-800">
                        {rawJsonResponse ? (typeof rawJsonResponse === 'string' ? JSON.stringify(JSON.parse(rawJsonResponse), null, 2) : JSON.stringify(rawJsonResponse, null, 2)) : 'No JSON response available'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

                {/* AFTER EXTRACTION */}
                <div className="bg-gradient-to-br from-green-50/90 via-emerald-50/90 to-green-50/90 dark:from-green-950/40 dark:via-emerald-950/40 dark:to-green-950/40 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border-2 border-green-200/60 dark:border-green-800/60 relative overflow-hidden animate-scale-in">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-green-400/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xl">
                          AFTER EXTRACTION
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold hidden sm:inline">Editable Data</span>
                      </div>
                    </div>

                  {/* SalesOrderHeader - AFTER */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-4 pb-2 border-b-2 border-green-300 dark:border-green-700">
                      SalesOrderHeader
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1 block">
                          Invoice Number
                        </label>
                        <input
                          type="text"
                          value={editedData.invoice_number || ''}
                          onChange={(e) => handleFieldChange('invoice_number', e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-green-300 dark:border-green-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1 block">
                          Invoice Date
                        </label>
                        <input
                          type="text"
                          value={editedData.invoice_date || ''}
                          onChange={(e) => handleFieldChange('invoice_date', e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-green-300 dark:border-green-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1 block">
                          Due Date
                        </label>
                        <input
                          type="text"
                          value={editedData.due_date || ''}
                          onChange={(e) => handleFieldChange('due_date', e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-green-300 dark:border-green-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1 block">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={editedData.customer_name || ''}
                          onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-green-300 dark:border-green-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1 block">
                          Vendor Name
                        </label>
                        <input
                          type="text"
                          value={editedData.vendor_name || ''}
                          onChange={(e) => handleFieldChange('vendor_name', e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-green-300 dark:border-green-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1 block">
                          Currency
                        </label>
                        <input
                          type="text"
                          value={editedData.currency || ''}
                          onChange={(e) => handleFieldChange('currency', e.target.value)}
                          className="w-full px-4 py-2.5 border-2 border-green-300 dark:border-green-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1 block">
                            Subtotal
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editedData.subtotal || 0}
                            onChange={(e) => handleFieldChange('subtotal', e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-green-300 dark:border-green-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1 block">
                            Tax
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editedData.tax || 0}
                            onChange={(e) => handleFieldChange('tax', e.target.value)}
                            className="w-full px-4 py-2.5 border-2 border-green-300 dark:border-green-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md"
                          />
                        </div>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900/40 rounded-xl p-4 border-2 border-green-400 dark:border-green-600 shadow-inner">
                        <label className="text-xs font-semibold text-green-800 dark:text-green-300 uppercase tracking-wide mb-1 block">
                          Total Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editedData.total_amount || 0}
                          onChange={(e) => handleFieldChange('total_amount', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-green-400 dark:border-green-600 rounded-lg bg-white dark:bg-slate-800 text-green-900 dark:text-green-200 text-xl font-bold focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1 block">
                          Billing Address
                        </label>
                        <textarea
                          value={editedData.billing_address || ''}
                          onChange={(e) => handleFieldChange('billing_address', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2.5 border-2 border-green-300 dark:border-green-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none shadow-sm hover:shadow-md"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1 block">
                          Shipping Address
                        </label>
                        <textarea
                          value={editedData.shipping_address || ''}
                          onChange={(e) => handleFieldChange('shipping_address', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2.5 border-2 border-green-300 dark:border-green-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none shadow-sm hover:shadow-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SalesOrderDetail - AFTER */}
                  <div>
                    <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-4 pb-2 border-b-2 border-green-300 dark:border-green-700">
                      SalesOrderDetail
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-green-200 dark:border-green-800/50">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-green-100 dark:bg-green-900/40 border-b border-green-200 dark:border-green-800">
                            <th className="text-left py-3 px-3 text-green-800 dark:text-green-300 font-bold">Line</th>
                            <th className="text-left py-3 px-3 text-green-800 dark:text-green-300 font-bold">Description</th>
                            <th className="text-right py-3 px-3 text-green-800 dark:text-green-300 font-bold">Qty</th>
                            <th className="text-right py-3 px-3 text-green-800 dark:text-green-300 font-bold">Unit Price</th>
                            <th className="text-right py-3 px-3 text-green-800 dark:text-green-300 font-bold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(editedData.line_items || []).map((item, idx) => (
                            <tr key={idx} className="border-b border-green-100 dark:border-green-900/30 bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors">
                              <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">{idx + 1}</td>
                              <td className="py-3 px-3">
                                <input
                                  type="text"
                                  value={item.description || ''}
                                  onChange={(e) => handleFieldChange(`line_item_${idx}_description`, e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow"
                                />
                              </td>
                              <td className="py-3 px-3">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.quantity || 0}
                                  onChange={(e) => handleFieldChange(`line_item_${idx}_quantity`, e.target.value)}
                                  className="w-full px-2 py-1.5 border-2 border-green-300 dark:border-green-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs text-right focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all"
                                />
                              </td>
                              <td className="py-3 px-3">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unit_price || 0}
                                  onChange={(e) => handleFieldChange(`line_item_${idx}_unit_price`, e.target.value)}
                                  className="w-full px-2 py-1.5 border-2 border-green-300 dark:border-green-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs text-right focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all"
                                />
                              </td>
                              <td className="py-3 px-3">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.total_price || 0}
                                  onChange={(e) => handleFieldChange(`line_item_${idx}_total_price`, e.target.value)}
                                  className="w-full px-2 py-1.5 border-2 border-green-300 dark:border-green-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs text-right font-semibold focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Database View */}
          {databaseInvoices.length > 0 && (
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 sm:p-8 lg:p-10 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-xl">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200">
                      Saved Invoices Database
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {databaseInvoices.length} invoice{databaseInvoices.length !== 1 ? 's' : ''} stored
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-inner">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
                        <th className="text-left py-5 px-5 sm:px-6 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm uppercase tracking-wider">OrderID</th>
                        <th className="text-left py-5 px-5 sm:px-6 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm uppercase tracking-wider">Invoice #</th>
                        <th className="text-left py-5 px-5 sm:px-6 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm uppercase tracking-wider">Customer</th>
                        <th className="text-left py-5 px-5 sm:px-6 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm uppercase tracking-wider">Vendor</th>
                        <th className="text-right py-5 px-5 sm:px-6 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm uppercase tracking-wider">Total</th>
                        <th className="text-left py-5 px-5 sm:px-6 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {databaseInvoices.map((invoice, idx) => (
                        <tr key={idx} className="bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 group">
                          <td className="py-4 px-5 sm:px-6 text-slate-800 dark:text-slate-200 font-bold">{invoice.OrderID}</td>
                          <td className="py-4 px-5 sm:px-6 text-slate-700 dark:text-slate-300 font-medium">{invoice.InvoiceNumber || '-'}</td>
                          <td className="py-4 px-5 sm:px-6 text-slate-700 dark:text-slate-300">{invoice.CustomerName || '-'}</td>
                          <td className="py-4 px-5 sm:px-6 text-slate-700 dark:text-slate-300">{invoice.VendorName || '-'}</td>
                          <td className="py-4 px-5 sm:px-6 text-slate-800 dark:text-slate-200 text-right font-bold text-base">
                            <span className="text-slate-500 dark:text-slate-400 text-sm font-normal">{invoice.Currency || ''}</span> {invoice.TotalAmount?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-4 px-5 sm:px-6 text-slate-600 dark:text-slate-400">{invoice.InvoiceDate || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
