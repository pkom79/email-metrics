import React, { useState } from 'react';
import { Zap, Send, Users, Activity, CircleDollarSign, ClipboardCheck, ChevronDown } from 'lucide-react';

interface AIReportTemplateProps {
  isDarkMode: boolean;
}


const categories = [
  {
    icon: <Zap className="w-5 h-5 text-violet-500" />,
    title: 'Flow Insights',
    insights: [
      { title: 'Flow Emails That Should Be Cut', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Flow vs Campaign Revenue Balance', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Flow Performance by Position', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Day-of-Week Flow Performance (Email 2+)', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'List Size Impact on Flow Performance', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
    ],
  },
  {
    icon: <Send className="w-5 h-5 text-violet-500" />,
    title: 'Campaign Insights',
    insights: [
      { title: 'Subject Line Revenue Drivers', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Campaign Spacing Impact', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Zero-Order High-Engagement Campaigns', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Campaign Theme Performance Analysis', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Perfect Campaign Recipe Detector', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Click-to-Purchase Conversion Drop-off', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
    ],
  },
  {
    icon: <Users className="w-5 h-5 text-violet-500" />,
    title: 'Subscriber Insights',
    insights: [
      { title: 'Subscriber Decay Alert', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Subscriber Lifecycle + Dead Weight', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'High-Value Subscriber Engagement', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Recent List Growth vs Quality', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'New Subscriber Early Engagement Trend', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
    ],
  },
  {
    icon: <Activity className="w-5 h-5 text-violet-500" />,
    title: 'List Health & Deliverability',
    insights: [
      { title: 'Campaign Fatigue Pattern', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Bounce Rate Trend Analysis', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Spam Complaint Rate by Campaign Size', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
    ],
  },
  {
    icon: <CircleDollarSign className="w-5 h-5 text-violet-500" />,
    title: 'Revenue & Performance Trends',
    insights: [
      { title: 'Revenue Concentration Risk', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Revenue Per Email Trend', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
    ],
  },
  {
    icon: <ClipboardCheck className="w-5 h-5 text-violet-500" />,
    title: 'Segmentation & Timing',
    insights: [
      { title: 'Your Money-Making Time Window', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Day-of-Week Revenue Reliability', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Revenue Clustering by Send Time', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
      { title: 'Campaign Performance by List Size', summary: '[summary]', actionsTitle: '[actionsTitle]', actions: ['[action1]'] },
    ],
  },
];

const AIReportTemplate: React.FC<AIReportTemplateProps> = ({ isDarkMode }) => {
  const [open, setOpen] = useState<{ [key: string]: boolean }>({});
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const toggle = (catIdx: number, insIdx: number) => {
    const key = `${catIdx}-${insIdx}`;
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };


  // Top 5 priorities (placeholders)
  const topPriorities = [
    { title: '[priorityTitle1]', impact: '[priorityImpact1]' },
    { title: '[priorityTitle2]', impact: '[priorityImpact2]' },
    { title: '[priorityTitle3]', impact: '[priorityImpact3]' },
    { title: '[priorityTitle4]', impact: '[priorityImpact4]' },
    { title: '[priorityTitle5]', impact: '[priorityImpact5]' },
  ];

  return (
    <div className="rounded-2xl pt-5 pb-8 px-4 md:px-8 shadow-lg" style={isDarkMode ? { backgroundColor: 'transparent' } : { backgroundColor: 'white' }}>
      {/* Report generated date at the top, centered */}
      <div className="flex justify-center mb-5">
        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Report generated {dateString}</span>
      </div>

      {/* Executive Summary */}
      <div className="mb-8">
        <div className={`text-center text-xl font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Executive Summary</div>
        <div className={`text-center text-lg font-normal mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          Your email account generated <span className="font-semibold text-purple-400">[totalRevenue]</span> over the last <span className="font-semibold">[dateRange]</span> with [keyFinding1], [keyFinding2], [keyFinding3] and [keyFinding4].
        </div>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center md:items-stretch">
          {[1,2,3,4].map((i) => (
            <div
              key={i}
              className={`flex-1 min-w-[220px] max-w-xs rounded-2xl border ${isDarkMode ? 'bg-[#232b39] border-gray-700' : 'bg-gray-50 border-gray-200'} flex flex-col items-center justify-center p-6 shadow`}
            >
              <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                [metricValue{i}]
              </div>
              <div className={`uppercase tracking-wide text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                [METRICLABEL{i}]
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights by Category */}
      {categories.map((cat, catIdx) => (
        <div key={catIdx} className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            {cat.icon}
            <h3 className="text-xl font-semibold text-left">{cat.title}</h3>
          </div>
          <div className="space-y-6">
            {cat.insights.map((ins, insIdx) => (
              <div
                key={insIdx}
                className={`rounded-xl border ${isDarkMode ? 'bg-[#232b39] border-gray-700' : 'bg-white/80 border-gray-200'} shadow p-6 text-left`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-base">
                    {insIdx + 1}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{ins.title}</h4>
                    <p className={`mb-3 ${isDarkMode ? 'text-purple-200' : 'text-purple-700'}`}>{ins.summary}</p>
                    <button
                      onClick={() => toggle(catIdx, insIdx)}
                      className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all border ${isDarkMode ? 'bg-purple-900/30 border-purple-800 text-purple-200 hover:bg-purple-900/50' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'}`}
                      aria-expanded={!!open[`${catIdx}-${insIdx}`]}
                    >
                      <span>Show Me What to Do</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${open[`${catIdx}-${insIdx}`] ? 'rotate-180' : ''}`} />
                    </button>
                    {open[`${catIdx}-${insIdx}`] && (
                      <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-900/60 text-gray-200' : 'bg-gray-100 text-gray-700'} text-left`}>
                        <div className="font-semibold mb-2">{ins.actionsTitle}</div>
                        <ul className="list-disc pl-5 space-y-1">
                          {ins.actions.map((action, aidx) => (
                            <li key={aidx}>{action}</li>
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
      ))}

      {/* Top 5 Priorities */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17.75l-6.172 3.245 1.179-6.873L2 9.755l6.908-1.004L12 2.5l3.092 6.251L22 9.755l-5.007 4.367 1.179 6.873z" /></svg></span>
          <h3 className="text-xl font-semibold text-left">Top 5 Priorities</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {topPriorities.map((p, i) => (
            <div key={i} className={`flex items-center gap-4 px-4 py-3 ${isDarkMode ? 'bg-[#232b39]' : 'bg-white'}`}>
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-base ${isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-700'}`}>{i + 1}</span>
              <div className="flex-1">
                <div className="font-medium text-left">{p.title}</div>
                <div className={`text-sm ${isDarkMode ? 'text-purple-200' : 'text-purple-700'} text-left`}>{p.impact}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIReportTemplate;
