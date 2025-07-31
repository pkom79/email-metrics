// integration-example.tsx
// This file demonstrates how to integrate AI enhancement into your Dashboard component
// Copy the relevant parts into your actual Dashboard.tsx file

import React, { useState } from 'react';

// Type definitions - copy these to your types file
interface EnhancedAnalysis {
  insights: {
    [key: string]: {
      originalInsight: {
        title: string;
        significance: number;
        confidence: number;
      };
      aiEnhancement: {
        deeperAnalysis: string;
        rootCause: string;
        predictedImpact: string;
        specificActions: string[];
      };
    };
  };
  customDiscoveries: Array<{
    title: string;
    finding: string;
    evidence: string;
    estimatedValue: number;
    implementation: string;
  }>;
  strategicSynthesis: {
    biggestOpportunity: string;
    primaryRisk: string;
    prioritizedActions: Array<{
      action: string;
      expectedROI: string;
      timeframe: string;
      effort: 'low' | 'medium' | 'high';
    }>;
  };
}

// Mock function to demonstrate context generation
const generateEnhancedContext = (
  userContext: any,
  campaigns: any[],
  flows: any[],
  subscribers: any[],
  insights: any[]
) => {
  return {
    ...userContext,
    accountMetrics: {
      totalCampaigns: campaigns.length,
      totalFlows: flows.length,
      totalSubscribers: subscribers.length,
    },
    insightCount: insights.length
  };
};

// Example Dashboard component showing AI enhancement integration
const DashboardWithAIEnhancement: React.FC = () => {
  // State management
  const [aiEnhancedAnalysis, setAiEnhancedAnalysis] = useState<EnhancedAnalysis | null>(null);
  const [isEnhancingWithAI, setIsEnhancingWithAI] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [showContextModal, setShowContextModal] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysisStarted, setAiAnalysisStarted] = useState(false);
  const [contextFormComplete, setContextFormComplete] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Example data - replace with your actual data
  const session = { access_token: 'your-token-here' };
  const filteredCampaigns: any[] = [];
  const filteredFlowEmails: any[] = [];
  const dataManager = {
    getSubscribers: () => []
  };
  const dateRange = '30d';
  const productCategory = 'Fashion';
  const priceRange = '$50-$100';
  const slowestMonth = 'February';
  const isDarkMode = false;

  // Enhanced AI generation function
  const generateAIInsightsWithEnhancement = async () => {
    try {
      setIsGeneratingInsights(true);
      setIsEnhancingWithAI(true);
      
      // Step 1: Generate standard 25 insights
      // Note: Replace with your actual Supabase URL
      const response = await fetch('/functions/v1/process-email-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          campaigns: filteredCampaigns,
          flows: filteredFlowEmails, 
          subscribers: dataManager.getSubscribers(),
          dateRange,
          accountId: 'user_account_id'
        })
      });
      
      const standardInsights = await response.json();
      setInsightsData(standardInsights);
      
      // Step 2: Generate enhanced context
      const userContext = {
        productCategory,
        priceRange, 
        slowestMonth
      };
      
      const enhancedContext = generateEnhancedContext(
        userContext,
        filteredCampaigns,
        filteredFlowEmails,
        dataManager.getSubscribers(),
        standardInsights.insights
      );
      
      // Step 3: Enhance with AI analysis
      const aiResponse = await fetch('/functions/v1/enhance-with-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          insights: standardInsights.insights,
          enhancedContext,
          accountId: 'user_account_id'
        })
      });
      
      const aiAnalysis = await aiResponse.json();
      setAiEnhancedAnalysis(aiAnalysis.analysis);
      
      setIsGeneratingInsights(false);
      setIsEnhancingWithAI(false);
      
    } catch (error) {
      console.error('AI enhancement failed:', error);
      setIsGeneratingInsights(false); 
      setIsEnhancingWithAI(false);
    }
  };

  // Handle context form submission
  const handleContextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contextFormComplete) {
      setShowContextModal(false);
      setShowAIAnalysis(true);
      setAiAnalysisStarted(true);
      generateAIInsightsWithEnhancement();
    }
  };

  // Render example
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">AI Enhancement Integration Example</h1>
      
      <button 
        onClick={generateAIInsightsWithEnhancement}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        disabled={isGeneratingInsights || isEnhancingWithAI}
      >
        {isEnhancingWithAI ? 'Enhancing with AI...' : 'Generate AI-Enhanced Insights'}
      </button>

      {/* Example of using AIReportTemplate with enhanced data */}
      {aiAnalysisStarted && (
        <div className="mt-8">
          <AIReportTemplateExample 
            isDarkMode={isDarkMode} 
            report={aiReport || undefined}
            isLoading={isGeneratingReport}
            enhancedAnalysis={aiEnhancedAnalysis || undefined}
            isEnhancing={isEnhancingWithAI}
          />
        </div>
      )}
    </div>
  );
};

// Enhanced AIReportTemplate props interface
interface AIReportTemplateProps {
  isDarkMode: boolean;
  report?: any;
  isLoading: boolean;
  enhancedAnalysis?: EnhancedAnalysis;
  isEnhancing?: boolean;
}

// Example AIReportTemplate component showing enhanced features
const AIReportTemplateExample: React.FC<AIReportTemplateProps> = ({ 
  isDarkMode, 
  report, 
  isLoading,
  enhancedAnalysis,
  isEnhancing = false
}) => {
  // Show enhanced insights if available
  const displayInsights = enhancedAnalysis?.insights || report?.insights || [];
  const customDiscoveries = enhancedAnalysis?.customDiscoveries || [];
  const strategicSynthesis = enhancedAnalysis?.strategicSynthesis;
  
  return (
    <div className="ai-report-container mt-8 p-6 border rounded-lg">
      {/* Loading states */}
      {isLoading && (
        <div className="text-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Generating 25 email marketing insights...</p>
        </div>
      )}
      
      {isEnhancing && (
        <div className="text-center p-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
          <div className="animate-pulse h-8 w-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-purple-700 dark:text-purple-300 font-medium">
            🧠 Enhancing with AI Analysis...
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Discovering hidden patterns and custom opportunities
          </p>
        </div>
      )}
      
      {/* Enhanced Analysis Results */}
      {enhancedAnalysis && (
        <div className="space-y-8">
          
          {/* Strategic Synthesis - Show first */}
          {strategicSynthesis && (
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-4">🎯 Strategic Analysis</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">💎 Biggest Opportunity</h4>
                  <p className="text-purple-100">{strategicSynthesis.biggestOpportunity}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">⚠️ Primary Risk</h4>
                  <p className="text-purple-100">{strategicSynthesis.primaryRisk}</p>
                </div>
              </div>
              
              {strategicSynthesis.prioritizedActions.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">📋 Prioritized Actions</h4>
                  <div className="space-y-3">
                    {strategicSynthesis.prioritizedActions.map((action, index) => (
                      <div key={index} className="bg-white/10 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{action.action}</p>
                            <p className="text-sm text-purple-200 mt-1">
                              Expected: {action.expectedROI} • Timeline: {action.timeframe}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            action.effort === 'low' ? 'bg-green-500' :
                            action.effort === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            {action.effort} effort
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Custom Discoveries */}
          {customDiscoveries.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-yellow-200 dark:border-yellow-800">
              <h3 className="text-xl font-bold mb-4 text-yellow-700 dark:text-yellow-300">
                🔍 Custom Discoveries
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Unique insights discovered by AI analysis, specific to your business
              </p>
              
              <div className="space-y-4">
                {customDiscoveries.map((discovery, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {discovery.title}
                      </h4>
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                        ${discovery.estimatedValue.toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {discovery.finding}
                    </p>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <strong>Evidence:</strong> {discovery.evidence}
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                      <strong className="text-blue-700 dark:text-blue-300">Implementation:</strong>
                      <p className="text-blue-600 dark:text-blue-400 mt-1">
                        {discovery.implementation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Enhanced Standard Insights */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">🧠 AI-Enhanced Insights</h3>
            {Object.entries(enhancedAnalysis.insights).map(([insightId, enhancement]) => (
              <div key={insightId} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                
                {/* Original insight header */}
                <div className="mb-4">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {enhancement.originalInsight.title}
                  </h4>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-500">
                      Significance: {(enhancement.originalInsight.significance * 100).toFixed(0)}%
                    </span>
                    <span className="text-sm text-gray-500">
                      Confidence: {(enhancement.originalInsight.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                {/* AI Enhancement */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg">
                  <h5 className="font-medium text-purple-700 dark:text-purple-300 mb-3">
                    🧠 AI Deep Analysis
                  </h5>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Analysis:</strong> {enhancement.aiEnhancement.deeperAnalysis}
                    </div>
                    
                    <div>
                      <strong>Root Cause:</strong> {enhancement.aiEnhancement.rootCause}
                    </div>
                    
                    <div>
                      <strong>Predicted Impact:</strong> {enhancement.aiEnhancement.predictedImpact}
                    </div>
                    
                    {enhancement.aiEnhancement.specificActions.length > 0 && (
                      <div>
                        <strong>Specific Actions:</strong>
                        <ul className="mt-2 space-y-1">
                          {enhancement.aiEnhancement.specificActions.map((action, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardWithAIEnhancement;
