
import React, { useState, useEffect } from 'react';
import { Ticket } from '../types';
import { XIcon } from './icons/XIcon';
import { PlusIcon } from './icons/PlusIcon';
import { MinusIcon } from './icons/MinusIcon';
import { PencilIcon } from './icons/PencilIcon';

interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onEdit?: () => void;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ ticket, onClose, onEdit }) => {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Reset panning when zoom is reset to 1
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  const handleZoomIn = () => setScale(prev => Math.min(3, prev + 0.2));
  const handleZoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));
  
  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default to stop scrolling the page while dragging the image
    // Note: complex gestures (pinch) might need more logic, this handles 1 finger drag
    if (e.touches.length === 1) {
        setIsDragging(true);
        setStartPos({
            x: e.touches[0].clientX - position.x,
            y: e.touches[0].clientY - position.y
        });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    // We don't preventDefault here unconditionally as it might block other gestures, 
    // but usually needed for drag.
    
    if (e.touches.length === 1) {
        setPosition({
            x: e.touches[0].clientX - startPos.x,
            y: e.touches[0].clientY - startPos.y
        });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full h-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-center z-10">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
             <h3 className="text-xl font-bold text-white">כרטיס: {ticket.type}</h3>
             {onEdit && (
                 <button onClick={onEdit} className="p-2 text-gray-300 hover:text-white bg-black/30 rounded-full hover:bg-black/50 transition-colors" title="ערוך פרטי כרטיס">
                     <PencilIcon className="h-5 w-5" />
                 </button>
             )}
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white bg-black/30 rounded-full p-2">
            <XIcon className="h-6 w-6"/>
          </button>
        </div>

        {/* Image container */}
        <div 
            className="flex-1 w-full flex items-center justify-center overflow-hidden p-4 touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <img 
              src={ticket.imageBase64} 
              alt="תמונת הכרטיס" 
              className="max-w-none max-h-none object-contain transition-transform duration-200"
              style={{ 
                  transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                  cursor: isDragging ? 'grabbing' : 'grab',
              }}
              draggable="false"
            />
        </div>

        {/* Controls panel at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center space-y-2">
            <div className="flex justify-center items-center space-x-6">
                <button onClick={handleZoomOut} className="bg-gray-700/80 p-3 rounded-full text-white hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={scale <= 0.5}>
                    <MinusIcon className="h-6 w-6" /> 
                </button>
                <span className="text-white font-mono w-16 text-center text-lg select-none">{(scale * 100).toFixed(0)}%</span>
                <button onClick={handleZoomIn} className="bg-gray-700/80 p-3 rounded-full text-white hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={scale >= 3.0}>
                    <PlusIcon className="h-6 w-6" />
                </button>
            </div>
            <p className="text-sm text-gray-300 pt-2">ניתן להזיז ולהגדיל את התמונה</p>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
