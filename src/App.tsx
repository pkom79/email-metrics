import React, { useState, useEffect } from 'react';
import UploadPage from './components/UploadPage';
import Dashboard from './components/Dashboard';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [uploads, setUploads] = useState({
    subscribers: false,
    flows: false,
    campaigns: false
  });

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // Update localStorage and document class when theme changes
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleFileUpload = (type: 'subscribers' | 'flows' | 'campaigns') => {
    setUploads(prev => ({ ...prev, [type]: true }));
  };

  const handleAnalyze = () => {
    setShowDashboard(true);
  };

  const handleUploadNew = () => {
    setShowDashboard(false);
    setUploads({ subscribers: false, flows: false, campaigns: false });
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      {showDashboard ? (
        <Dashboard onUploadNew={handleUploadNew} isDarkMode={isDarkMode} />
      ) : (
        <UploadPage 
          uploads={uploads}
          onFileUpload={handleFileUpload}
          onAnalyze={handleAnalyze}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}

export default App;