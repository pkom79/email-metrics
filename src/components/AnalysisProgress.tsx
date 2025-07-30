import React, { useState, useEffect } from 'react'

interface ProgressUpdate {
  jobId: string
  currentStage: string
  percentage: number
  stageName: string
  stageDescription: string
  estimatedTimeRemaining: number
  completedStages: string[]
  dataMetrics?: {
    campaigns: number
    flows: number
    subscribers: number
  }
}

interface AnalysisProgressProps {
  jobId: string
  onComplete: () => void
  onCancel: () => void
  onError: (error: string) => void
  supabase: any
  isDarkMode?: boolean
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  jobId,
  onComplete,
  onCancel,
  onError,
  supabase,
  isDarkMode = false
}) => {
  const [progress, setProgress] = useState<ProgressUpdate>({
    jobId,
    currentStage: 'validation',
    percentage: 0,
    stageName: 'Starting Analysis',
    stageDescription: 'Initializing email insights analysis...',
    estimatedTimeRemaining: 120,
    completedStages: []
  })
  
  const [isVisible, setIsVisible] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    if (!supabase || !jobId) return

    const channel = supabase
      .channel(`analysis-${jobId}`)
      .on('broadcast', { event: 'progress' }, (payload: any) => {
        setProgress(payload.payload)
        
        // Auto-complete when 100%
        if (payload.payload.percentage >= 100) {
          setTimeout(() => {
            setIsVisible(false)
            onComplete()
          }, 1500) // Show complete state briefly
        }
      })
      .on('broadcast', { event: 'error' }, (payload: any) => {
        onError(payload.payload.stageDescription || 'Analysis failed')
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [jobId, supabase, onComplete, onError])

  const handleCancel = async () => {
    setIsCancelling(true)
    
    try {
      // Update job status to cancelled
      await supabase
        .from('processing_jobs')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
      
      onCancel()
    } catch (error) {
      console.error('Failed to cancel job:', error)
      setIsCancelling(false)
    }
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const getStageIcon = (stageName: string): string => {
    const iconMap: Record<string, string> = {
      'Data Validation': '🔍',
      'Campaign Analysis': '📧', 
      'Flow Analysis': '🔄',
      'Subscriber Analysis': '👥',
      'Revenue Analysis': '💰',
      'Health Analysis': '📊',
      'Context Enhancement': '🧠',
      'AI Initialization': '🚀',
      'AI Analysis': '🤖',
      'Finalizing Results': '✨',
      'Analysis Complete': '🎉'
    }
    return iconMap[stageName] || '⚡'
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3 animate-bounce">
            {getStageIcon(progress.stageName)}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            AI Email Insights Analysis
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generating comprehensive insights for your email marketing
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {progress.stageName}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {progress.percentage}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progress.percentage}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Current Stage Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">
              {getStageIcon(progress.stageName)}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                {progress.stageName}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {progress.stageDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Time Estimate */}
        {progress.estimatedTimeRemaining > 0 && (
          <div className="flex items-center justify-center mb-6 space-x-2">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ~{formatTime(progress.estimatedTimeRemaining)} remaining
            </span>
          </div>
        )}

        {/* Data Metrics */}
        {progress.dataMetrics && (
          <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Analyzing your data:</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                  {progress.dataMetrics.campaigns.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Campaigns</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {progress.dataMetrics.flows.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Flows</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {progress.dataMetrics.subscribers.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Subscribers</div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Stages Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs">
            {['validation', 'campaign-insights', 'flow-insights', 'subscriber-insights', 'ai-processing', 'complete'].map((stageId, index) => (
              <div key={stageId} className="flex flex-col items-center space-y-1">
                <div 
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    progress.completedStages.includes(stageId)
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      : progress.currentStage === stageId
                      ? 'bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
                {index < 5 && (
                  <div 
                    className={`h-0.5 w-8 transition-all duration-300 ${
                      progress.completedStages.includes(stageId)
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            disabled={isCancelling || progress.percentage >= 90}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel'}
          </button>
          
          {progress.percentage >= 100 && (
            <button
              onClick={() => {
                setIsVisible(false)
                onComplete()
              }}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              View Results 🎉
            </button>
          )}
        </div>

        {/* Fine Print */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            AI analysis may take longer for comprehensive insights
          </p>
        </div>
      </div>
    </div>
  )
}

export default AnalysisProgress
