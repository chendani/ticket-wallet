
import React from 'react';
import { TicketIcon } from './icons/TicketIcon';
import { User } from '../types';

interface HeaderProps {
    user?: User | null;
    onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40 shadow-lg shadow-purple-500/10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <TicketIcon className="text-purple-400 h-8 w-8"/>
          <h1 className="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            ארנק הכרטיסים שלי
          </h1>
        </div>
        
        {user && (
             <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <span className="hidden sm:inline-block text-gray-300 text-sm">שלום, {user.name}</span>
                <button 
                    onClick={onLogout}
                    className="text-xs bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500/50 px-3 py-1.5 rounded-full transition-all"
                >
                    התנתק
                </button>
             </div>
        )}
      </div>
    </header>
  );
};

export default Header;
