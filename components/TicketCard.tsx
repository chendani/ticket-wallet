import React, { useState, useEffect, useRef } from 'react';
import { Ticket } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { TrashIcon } from './icons/TrashIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { ClipboardCopyIcon } from './icons/ClipboardCopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { PencilIcon } from './icons/PencilIcon';
import { MoveIcon } from './icons/MoveIcon';

interface TicketCardProps {
  ticket: Ticket;
  onView: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onMove: () => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onView, onDelete, onEdit, onMove }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showQrTooltip, setShowQrTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
            setShowQrTooltip(false);
        }
    };
    if (showQrTooltip) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQrTooltip]);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(ticket.qrCodeValue).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
        setShowQrTooltip(false);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col justify-between">
      <div>
        <h4 className="font-bold text-lg text-purple-300">{ticket.type}</h4>
        <div className="relative flex items-center text-sm text-gray-400 mt-2">
          <QrCodeIcon className="h-5 w-5 mr-2 ml-2 flex-shrink-0"/>
          <p className="flex-1 truncate">{ticket.qrCodeValue}</p>
          <button 
            onClick={() => setShowQrTooltip(s => !s)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors ml-2 rtl:mr-2 rtl:ml-0"
            aria-label="הצג והעתק קוד"
          >
             <ClipboardCopyIcon className="h-5 w-5" />
          </button>
           {showQrTooltip && (
              <div ref={tooltipRef} className="absolute bottom-full mb-2 -left-2 rtl:-right-2 rtl:left-auto w-64 bg-gray-900 border border-purple-500 rounded-lg shadow-lg z-10 p-3">
                  <p className="text-xs text-gray-400 mb-1">ערך קוד QR</p>
                  <p className="text-white break-words text-sm mb-2">{ticket.qrCodeValue}</p>
                  <button
                      onClick={handleCopyClick}
                      className="w-full bg-purple-600 text-white font-semibold py-1 px-2 rounded-md flex items-center justify-center space-x-2 rtl:space-x-reverse hover:bg-purple-700 transition-colors text-sm"
                  >
                      {isCopied ? <CheckIcon className="h-4 w-4" /> : <ClipboardCopyIcon className="h-4 w-4" />}
                      <span>{isCopied ? 'הועתק!' : 'העתק קוד'}</span>
                  </button>
              </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse mt-4">
        <button
          onClick={onDelete}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors"
          aria-label="מחק כרטיס"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
         <button
          onClick={onMove}
          className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded-full transition-colors"
          aria-label="העבר כרטיס"
        >
          <MoveIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-700 rounded-full transition-colors"
          aria-label="ערוך כרטיס"
        >
          <PencilIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onView}
          className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 rtl:space-x-reverse hover:bg-purple-700 transition-colors"
        >
          <EyeIcon className="h-5 w-5" />
          <span>הצג כרטיס</span>
        </button>
      </div>
    </div>
  );
};

export default TicketCard;