
import React, { useState, useCallback, useEffect } from 'react';
import { extractTicketDetailsFromImage } from '../services/geminiService';
import { ExtractedTicketData, Ticket, NewTicketPayload, Event } from '../types';
import Loader from './Loader';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';
import ProgressBar from './ProgressBar';

declare const pdfjsLib: any;

interface AddTicketFlowProps {
  onBatchAdd: (payloads: NewTicketPayload[]) => void;
  onCancel: () => void;
}

interface TicketProcessingState {
  id: number;
  file: File;
  status: 'pending' | 'processing-file' | 'processing-ai' | 'review' | 'error';
  imageBase64: string | null;
  mimeType: string | null;
  formData: ExtractedTicketData | null;
  error: string | null;
  showCustomTypeInput: boolean;
  isDateInvalid: boolean;
}

const ticketTypeSuggestions = [
    "כרטיס כניסה", "שובר אוכל", "שובר למשחק", "שובר לשתיה"
];

const AddTicketFlow: React.FC<AddTicketFlowProps> = ({ onBatchAdd, onCancel }) => {
  const [tickets, setTickets] = useState<TicketProcessingState[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const updateTicketState = useCallback((id: number, updates: Partial<TicketProcessingState>) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);
  
  const getStatusInfo = (status: TicketProcessingState['status']): { progress: number; text: string } => {
    switch (status) {
        case 'pending':
            return { progress: 10, text: 'ממתין לעיבוד...' };
        case 'processing-file':
            return { progress: 30, text: 'מעבד קובץ...' };
        case 'processing-ai':
            return { progress: 70, text: 'מנתח באמצעות AI...' };
        case 'review':
            return { progress: 100, text: 'מוכן לבדיקה' };
        case 'error':
            return { progress: 0, text: 'שגיאה' };
        default:
            return { progress: 0, text: 'מעבד...' };
    }
  };


  const handleFileProcessing = useCallback(async (ticket: TicketProcessingState) => {
    updateTicketState(ticket.id, { status: 'processing-file' });
    try {
      let base64: string | null = null;
      let mime: string | null = null;

      if (ticket.file.type === "application/pdf") {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs`;
        const arrayBuffer = await ticket.file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (!context) throw new Error("לא ניתן ליצור קונטקסט של קנבס");
        
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        base64 = canvas.toDataURL('image/jpeg');
        mime = 'image/jpeg';
      } else {
        const reader = new FileReader();
        const result = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject("שגיאה בקריאת הקובץ.");
            reader.readAsDataURL(ticket.file);
        });
        base64 = result;
        mime = ticket.file.type;
      }
      
      if (!base64 || !mime) throw new Error("עיבוד הקובץ נכשל");

      updateTicketState(ticket.id, { 
        status: 'processing-ai', 
        imageBase64: base64, 
        mimeType: mime
      });
      
      const base64Data = base64.split(',')[1];
      const data = await extractTicketDetailsFromImage(base64Data, mime);

      const isValidDate = data.date && data.date.match(/^\d{4}-\d{2}-\d{2}$/) && !isNaN(new Date(data.date).getTime());
      if (!isValidDate) {
          data.date = '';
      }
      
      updateTicketState(ticket.id, {
        status: 'review',
        formData: data,
        showCustomTypeInput: !!data.ticketType,
        isDateInvalid: !isValidDate,
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : "שגיאה לא ידועה.";
      updateTicketState(ticket.id, { status: 'error', error: message });
    }
  }, [updateTicketState]);

  useEffect(() => {
    tickets.forEach(ticket => {
        if (ticket.status === 'pending') {
            handleFileProcessing(ticket);
        }
    });
  }, [tickets, handleFileProcessing]);

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newTickets: TicketProcessingState[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      file,
      status: 'pending',
      imageBase64: null,
      mimeType: null,
      formData: null,
      error: null,
      showCustomTypeInput: false,
      isDateInvalid: false,
    }));
    setTickets(prev => [...prev, ...newTickets]);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    event.target.value = ''; // Allow re-uploading the same file
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    processFiles(event.dataTransfer.files);
  };
  
  const handleFormChange = (id: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const ticket = tickets.find(t => t.id === id);
    if (!ticket || !ticket.formData) return;

    const updates: Partial<TicketProcessingState> = {};
    const newFormData = { ...ticket.formData, [e.target.name]: e.target.value };
    updates.formData = newFormData;

    if (e.target.name === 'date' && ticket.isDateInvalid) {
        updates.isDateInvalid = false;
    }

    updateTicketState(id, updates);
  };
  
  const handleRemoveTicket = (id: number) => {
    setTickets(prev => prev.filter(t => t.id !== id));
  };
  
  const handleRetryTicket = (id: number) => {
    const ticket = tickets.find(t => t.id === id);
    if(ticket) {
      handleFileProcessing({...ticket, status: 'pending'});
    }
  };

  const handleSaveAll = () => {
    const ticketsToSubmit = tickets.filter(t => t.status === 'review' && t.formData && t.imageBase64);

    const payloads: NewTicketPayload[] = ticketsToSubmit.map(ticketState => {
      const newTicket: Ticket = {
        id: `tkt_${ticketState.id}`,
        type: ticketState.formData!.ticketType,
        qrCodeValue: ticketState.formData!.barcodeQRGist,
        imageBase64: ticketState.imageBase64!,
      };
      const eventDetails: Omit<Event, 'id' | 'tickets' | 'reminder'> = {
        name: ticketState.formData!.eventName,
        date: ticketState.formData!.date,
        time: ticketState.formData!.time,
        location: ticketState.formData!.location,
      };
      return { ticket: newTicket, eventDetails };
    });

    onBatchAdd(payloads);
    onCancel(); // Back to list view
  };

  const isProcessing = tickets.some(t => t.status.startsWith('processing') || t.status === 'pending');
  const isReadyToSave = tickets.some(t => t.status === 'review');

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">הוספת כרטיס חדש</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-white flex items-center space-x-2">
                <XIcon className="h-5 w-5"/> <span>ביטול</span>
            </button>
        </div>

        <div>
            <p className="text-gray-300 mb-4">העלה תמונה או קובץ PDF של הכרטיס הדיגיטלי שלך. המערכת תנסה לחלץ את הפרטים באופן אוטומטי.</p>
            <label 
                htmlFor="ticket-upload" 
                className={`w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600 hover:bg-gray-700/50 hover:border-purple-400'} ${isProcessing ? 'cursor-wait opacity-70' : ''}`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={handleDrop}
            >
                {isDragging ? (
                     <span className="text-xl font-semibold text-purple-400 pointer-events-none">שחרר קבצים כאן</span>
                ) : isProcessing ? (
                    <div className="text-center pointer-events-none">
                        <Loader />
                        <span className="text-lg font-semibold text-gray-300 mt-4 block">מעבד קבצים...</span>
                    </div>
                ) : (
                    <div className="text-center pointer-events-none">
                        <UploadIcon className="h-12 w-12 text-gray-500 mb-4 mx-auto"/>
                        <span className="text-lg font-semibold text-gray-300">בחר קבצים להעלאה</span>
                        <span className="text-sm text-gray-400 block">או גרור ושחרר לכאן</span>
                    </div>
                )}
            </label>
            <input id="ticket-upload" type="file" className="hidden" accept="image/png, image/jpeg, application/pdf" onChange={handleFileChange} disabled={isProcessing} multiple />
        </div>

        {tickets.length > 0 && (
            <div className="mt-8 space-y-6">
                {tickets.map(ticket => {
                    const statusInfo = getStatusInfo(ticket.status);
                    return (
                        <div key={ticket.id} className="bg-gray-700/50 p-4 rounded-lg shadow-md relative">
                            <div className="flex justify-between items-start">
                               <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                                  {ticket.imageBase64 && <img src={ticket.imageBase64} alt="תצוגה מקדימה" className="w-16 h-16 object-cover rounded-md"/>}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white truncate w-48 sm:w-full">{ticket.file.name}</p>
                                    <p className="text-sm text-gray-400">{statusInfo.text}</p>
                                  </div>
                               </div>
                                <button onClick={() => handleRemoveTicket(ticket.id)} className="text-gray-500 hover:text-white absolute top-2 right-2 rtl:left-2 rtl:right-auto">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {(ticket.status === 'pending' || ticket.status === 'processing-file' || ticket.status === 'processing-ai') && (
                                <div className="mt-4">
                                    <ProgressBar progress={statusInfo.progress} />
                                </div>
                            )}
                            
                            {ticket.status === 'error' && (
                                <div className="text-center py-4">
                                    <p className="text-red-400 mb-2">{ticket.error}</p>
                                    <button onClick={() => handleRetryTicket(ticket.id)} className="text-purple-400 hover:text-purple-300 font-semibold">נסה שוב</button>
                                </div>
                            )}
    
                            {ticket.status === 'review' && ticket.formData && (
                                 <form onSubmit={(e) => e.preventDefault()} className="space-y-4 mt-4 border-t border-gray-600 pt-4">
                                    <div>
                                        <label htmlFor={`eventName-${ticket.id}`} className="block text-sm font-medium text-gray-300 mb-1">שם האירוע</label>
                                        <input type="text" name="eventName" id={`eventName-${ticket.id}`} value={ticket.formData.eventName} onChange={(e) => handleFormChange(ticket.id, e)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" required />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor={`date-${ticket.id}`} className="block text-sm font-medium text-gray-300 mb-1">תאריך</label>
                                            <input type="date" name="date" id={`date-${ticket.id}`} value={ticket.formData.date} onChange={(e) => handleFormChange(ticket.id, e)} className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white ${ticket.isDateInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-purple-500 focus:border-purple-500'}`} required />
                                            {ticket.isDateInvalid && <p className="mt-1 text-sm text-red-400">התאריך שזוהה לא היה תקין. אנא בחר תאריך.</p>}
                                        </div>
                                        <div>
                                            <label htmlFor={`time-${ticket.id}`} className="block text-sm font-medium text-gray-300 mb-1">שעה</label>
                                            <input type="time" name="time" id={`time-${ticket.id}`} value={ticket.formData.time} onChange={(e) => handleFormChange(ticket.id, e)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor={`location-${ticket.id}`} className="block text-sm font-medium text-gray-300 mb-1">מיקום (אופציונלי)</label>
                                        <input type="text" name="location" id={`location-${ticket.id}`} value={ticket.formData.location} onChange={(e) => handleFormChange(ticket.id, e)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                                    </div>
                                    <div>
                                        <label htmlFor={`ticketType-${ticket.id}`} className="block text-sm font-medium text-gray-300 mb-1">סוג הכרטיס</label>
                                        {ticket.showCustomTypeInput ? (
                                             <input type="text" name="ticketType" id={`ticketType-${ticket.id}`} value={ticket.formData.ticketType} onChange={(e) => handleFormChange(ticket.id, e)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" required />
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {ticketTypeSuggestions.map(type => (
                                                    <button type="button" key={type} onClick={() => { handleFormChange(ticket.id, { target: { name: 'ticketType', value: type } } as any); updateTicketState(ticket.id, {showCustomTypeInput: true}) }} className="bg-gray-600 hover:bg-purple-500 text-white py-2 px-4 rounded-lg transition-colors">{type}</button>
                                                ))}
                                                <button type="button" onClick={() => updateTicketState(ticket.id, {showCustomTypeInput: true})} className="bg-gray-600 hover:bg-gray-500 text-gray-300 py-2 px-4 rounded-lg transition-colors">אחר...</button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor={`barcodeQRGist-${ticket.id}`} className="block text-sm font-medium text-gray-300 mb-1">ערך קוד QR / ברקוד</label>
                                        <input type="text" name="barcodeQRGist" id={`barcodeQRGist-${ticket.id}`} value={ticket.formData.barcodeQRGist} onChange={(e) => handleFormChange(ticket.id, e)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500" />
                                    </div>
                                 </form>
                            )}
                        </div>
                    )
                })}
            </div>
        )}

        {tickets.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-700 flex justify-end">
                <button 
                    onClick={handleSaveAll}
                    disabled={isProcessing || !isReadyToSave}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  <span className={isProcessing ? 'mr-2' : ''}>שמור את כל הכרטיסים</span>
                </button>
            </div>
        )}
    </div>
  );
};

export default AddTicketFlow;