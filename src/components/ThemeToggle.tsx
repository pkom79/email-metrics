import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className={`
        fixed top-4 right-4 z-50 p-3 rounded-full transition-all duration-200
        ${isDarkMode 
          ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
          : 'bg-white hover:bg-gray-100 text-gray-700'
        }
        shadow-lg hover:shadow-xl border
        ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
      `}
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;