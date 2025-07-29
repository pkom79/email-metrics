import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, FileText, Zap, Send, BarChart3, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { DataManager, LoadProgress } from '../utils/dataManager';

interface UploadPageProps {
  uploads: {
    subscribers: boolean;
    flows: boolean;
    campaigns: boolean;
  };
  onFileUpload: (type: 'subscribers' | 'flows' | 'campaigns') => void;
  onAnalyze: () => void;
  isDarkMode: boolean;
}

const UploadPage: React.FC<UploadPageProps> = ({ uploads, onFileUpload, onAnalyze, isDarkMode }) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<LoadProgress | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // File storage
  const fileRefs = useRef<{
    campaigns?: File;
    flows?: File;
    subscribers?: File;
  }>({});

  const allUploaded = uploads.subscribers && uploads.flows && uploads.campaigns;

  const uploadZones = [
    {
      id: 'subscribers',
      title: 'Subscribers Report',
      description: 'Import your subscriber list and segmentation data',
      icon: FileText,
      uploaded: uploads.subscribers,
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      id: 'flows',
      title: 'Email Flows Report',
      description: 'Automated email sequences and journey performance',
      icon: Zap,
      uploaded: uploads.flows,
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      id: 'campaigns',
      title: 'Email Campaigns Report',
      description: 'One-time campaign metrics and engagement data',
      icon: Send,
      uploaded: uploads.campaigns,
      gradient: 'from-pink-500 to-red-500'
    }
  ];

  const handleFileSelect = async (type: 'subscribers' | 'flows' | 'campaigns') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Store the file
      fileRefs.current[type] = file;

      // Mark as uploaded
      onFileUpload(type);

      // If all files are uploaded, automatically process them
      if (type === 'campaigns' && fileRefs.current.subscribers && fileRefs.current.flows) {
        await processFiles();
      } else if (type === 'flows' && fileRefs.current.subscribers && fileRefs.current.campaigns) {
        await processFiles();
      } else if (type === 'subscribers' && fileRefs.current.flows && fileRefs.current.campaigns) {
        await processFiles();
      }
    };

    input.click();
  };

  const processFiles = async () => {
    if (!fileRefs.current.campaigns || !fileRefs.current.flows || !fileRefs.current.subscribers) {
      return;
    }

    setIsProcessing(true);
    setErrors([]);

    try {
      const dataManager = DataManager.getInstance();
      const result = await dataManager.loadCSVFiles(
        fileRefs.current,
        (progress) => setProcessingProgress(progress)
      );

      if (!result.success) {
        setErrors(result.errors);
      } else {
        // Get summary stats
        const stats = dataManager.getSummaryStats();
        console.log('Data loaded successfully:', stats);
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Unknown error occurred']);
    } finally {
      setIsProcessing(false);
    }
  };

  const getProgressPercentage = (): number => {
    if (!processingProgress) return 0;
    const { campaigns, flows, subscribers } = processingProgress;
    return Math.round((campaigns.progress + flows.progress + subscribers.progress) / 3);
  };

  const UploadZone = ({ zone }: { zone: typeof uploadZones[0] }) => {
    const Icon = zone.icon;
    const isHovered = hoveredZone === zone.id;
    const file = fileRefs.current[zone.id as keyof typeof fileRefs.current];

    return (
      <div
        onClick={() => !isProcessing && handleFileSelect(zone.id as 'subscribers' | 'flows' | 'campaigns')}
        onMouseEnter={() => setHoveredZone(zone.id)}
        onMouseLeave={() => setHoveredZone(null)}
        className={`
          group relative overflow-hidden cursor-pointer transition-all duration-300 ease-out
          ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} 
          backdrop-blur-sm border rounded-2xl p-8
          ${zone.uploaded
            ? `border-green-400/50 ${isDarkMode ? 'bg-green-900/10' : 'bg-green-50/80'}`
            : `${isDarkMode ? 'border-gray-700/50 hover:border-purple-500/50' : 'border-gray-200/50 hover:border-purple-400/50'}`
          }
          hover:shadow-2xl hover:-translate-y-2 transform
          ${isHovered && !isProcessing ? 'scale-105' : ''}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Gradient background overlay */}
        <div className={`
          absolute inset-0 bg-gradient-to-br ${zone.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300
        `} />

        {/* Animated border glow */}
        <div className={`
          absolute inset-0 rounded-2xl bg-gradient-to-r ${zone.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300
        `} />

        <div className="relative z-10">
          {/* Icon container */}
          <div className={`
            inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 transition-all duration-300
            ${zone.uploaded
              ? 'bg-green-100 dark:bg-green-900/30'
              : `bg-gradient-to-br ${zone.gradient} group-hover:scale-110`
            }
          `}>
            {zone.uploaded ? (
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : (
              <Icon className="w-8 h-8 text-white" />
            )}
          </div>

          {/* Content */}
          <h3 className={`
            text-xl font-semibold mb-3 transition-colors duration-200
            ${isDarkMode ? 'text-white' : 'text-gray-900'}
            ${isHovered && !isProcessing ? 'text-purple-600 dark:text-purple-400' : ''}
          `}>
            {zone.title}
          </h3>

          <p className={`
            text-sm leading-relaxed mb-4
            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
          `}>
            {zone.description}
          </p>

          {/* Status indicator */}
          {zone.uploaded ? (
            <div>
              <div className="flex items-center text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                File uploaded successfully
              </div>
              {file && (
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          ) : (
            <div className={`
              flex items-center text-sm font-medium transition-colors duration-200
              ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
              ${isHovered && !isProcessing ? 'text-purple-600 dark:text-purple-400' : ''}
            `}>
              <Upload className="w-4 h-4 mr-2" />
              Click to upload CSV file
            </div>
          )}

          {/* Hover arrow */}
          <div className={`
            absolute top-6 right-6 transition-all duration-300
            ${isHovered && !isProcessing ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
          `}>
            <ArrowRight className="w-5 h-5 text-purple-500" />
          </div>

          {/* Processing indicator for this file */}
          {isProcessing && processingProgress && (
            <div className="mt-2">
              <div className={`w-full h-1 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${zone.id === 'campaigns' ? processingProgress.campaigns.progress :
                        zone.id === 'flows' ? processingProgress.flows.progress :
                          processingProgress.subscribers.progress
                      }%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`
      min-h-screen relative overflow-hidden
      ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-purple-50'}
    `}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-6xl mx-auto w-full">
            {/* Hero section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 mb-8 shadow-lg">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>

              <h1 className={`
                text-5xl md:text-6xl font-bold mb-6 tracking-tight
                ${isDarkMode ? 'text-white' : 'text-gray-900'}
              `}>
                Email Analytics
                <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>

              <p className={`
                text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto
                ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
              `}>
                Transform your Klaviyo reports into actionable insights. Upload your CSV exports and get
                comprehensive analytics across campaigns, flows, and subscriber segments.
              </p>
            </div>

            {/* Error display */}
            {errors.length > 0 && (
              <div className={`mb-6 p-4 rounded-lg border ${isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-red-400' : 'text-red-800'}`}>
                      Error processing files:
                    </p>
                    <ul className={`mt-1 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Upload zones */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {uploadZones.map((zone) => (
                <UploadZone key={zone.id} zone={zone} />
              ))}
            </div>

            {/* Processing status */}
            {isProcessing && (
              <div className={`mb-8 p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Processing your data...
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className="h-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getProgressPercentage()}% complete
                </p>
              </div>
            )}

            {/* Analysis button */}
            <div className="text-center">
              <button
                onClick={onAnalyze}
                disabled={!allUploaded || isProcessing}
                className={`
                  group relative px-12 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform
                  ${allUploaded && !isProcessing
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1'
                    : `${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'} cursor-not-allowed`
                  }
                `}
              >
                <span className="relative z-10 flex items-center">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Analyze Your Data
                      <ArrowRight className={`ml-2 w-5 h-5 transition-transform duration-300 ${allUploaded && !isProcessing ? 'group-hover:translate-x-1' : ''}`} />
                    </>
                  )}
                </span>

                {allUploaded && !isProcessing && (
                  <>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -top-px rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                  </>
                )}
              </button>

              {!allUploaded && !isProcessing && (
                <p className={`
                  text-sm mt-4 
                  ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}
                `}>
                  Upload all three reports to enable analysis
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="pb-8">
          <div className="max-w-md mx-auto px-8">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Progress
              </span>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {Object.values(uploads).filter(Boolean).length} / 3
              </span>
            </div>
            <div className={`w-full h-4 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <div
                className="h-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(Object.values(uploads).filter(Boolean).length / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;