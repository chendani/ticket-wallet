import React, { useState } from 'react';
import { Ticket } from '../types';
import { XIcon } from './icons/XIcon';

interface EditTicketModalProps {
  ticket: Ticket;
  onSave: (updatedTicket: Ticket) => void;
  onClose: () => void;
}

const ticketTypeSuggestions = [
    "כרטיס כניסה", "שובר אוכל", "שובר למשחק", "שובר לשתיה"
];

const EditTicketModal: React.FC<EditTicketModalProps> = ({ ticket, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    type: ticket.type,
    qrCodeValue: ticket.qrCodeValue,
  });
  
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(
    () => !ticketTypeSuggestions.includes(ticket.type) && ticket.type !== ''
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleTypeButtonClick = (type: string) => {
    setFormData({ ...formData, type });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...ticket, ...formData });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">עריכת פרטי כרטיס</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ticketType" className="block text-sm font-medium text-gray-300 mb-2">סוג הכרטיס</label>
            {showCustomTypeInput ? (
                <div>
                  <input
                    type="text"
                    name="type"
                    id="ticketType"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                  <button type="button" onClick={() => setShowCustomTypeInput(false)} className="text-sm text-purple-400 hover:underline mt-2">
                    בחר סוג מהרשימה
                  </button>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {ticketTypeSuggestions.map(type => (
                        <button
                            type="button"
                            key={type}
                            onClick={() => handleTypeButtonClick(type)}
                            className={`font-semibold py-2 px-4 rounded-lg transition-colors ${formData.type === type ? 'bg-purple-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}
                        >
                            {type}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                          setShowCustomTypeInput(true);
                           if (ticketTypeSuggestions.includes(formData.type)) {
                              handleTypeButtonClick('');
                          }
                        }}
                        className="bg-gray-600 hover:bg-gray-500 text-gray-300 py-2 px-4 rounded-lg transition-colors"
                    >
                        אחר...
                    </button>
                </div>
            )}
          </div>
          <div>
            <label htmlFor="qrCodeValue" className="block text-sm font-medium text-gray-300 mb-1">ערך קוד QR / ברקוד</label>
            <textarea
              name="qrCodeValue"
              id="qrCodeValue"
              value={formData.qrCodeValue}
              onChange={handleChange}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-2">
            <button type="button" onClick={onClose} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">ביטול</button>
            <button type="submit" className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">שמור שינויים</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTicketModal;