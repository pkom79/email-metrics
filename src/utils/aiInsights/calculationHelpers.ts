import { ProcessedCampaign } from '../dataTypes';
import { SIGNIFICANCE_THRESHOLDS } from './types';

// Calculate average of a numeric array
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

// Calculate median of a numeric array
export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Calculate percentile
export function percentile(numbers: number[], p: number): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

// Calculate standard deviation
export function standardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const avg = average(numbers);
  const squareDiffs = numbers.map(n => Math.pow(n - avg, 2));
  return Math.sqrt(average(squareDiffs));
}

// Group campaigns by day and hour
export function groupByDayHour(campaigns: ProcessedCampaign[]): Map<string, ProcessedCampaign[]> {
  const grouped = new Map<string, ProcessedCampaign[]>();
  
  campaigns.forEach(campaign => {
    const dayOfWeek = campaign.sentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = campaign.sentDate.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const key = `${dayOfWeek} ${hour12} ${ampm}`;
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(campaign);
  });
  
  return grouped;
}

// Calculate revenue per recipient
export function revenuePerRecipient(campaigns: ProcessedCampaign[]): number {
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const totalRecipients = campaigns.reduce((sum, c) => sum + c.emailsSent, 0);
  return totalRecipients > 0 ? totalRevenue / totalRecipients : 0;
}

// Check if a difference is significant based on type
export function isSignificantDifference(
  value1: number,
  value2: number,
  type: 'revenue' | 'engagement' | 'spam' | 'unsubscribe',
  sampleSize: number = 0
): boolean {
  const threshold = SIGNIFICANCE_THRESHOLDS[type];
  
  // Check sample size if provided
  if (sampleSize > 0 && sampleSize < threshold.minSampleSize) {
    return false;
  }
  
  // For spam and unsubscribe, check both absolute and relative differences
  if (type === 'spam' || type === 'unsubscribe') {
    const absoluteDiff = Math.abs(value1 - value2);
    const relativeDiff = value2 > 0 ? value1 / value2 : 0;
    
    return absoluteDiff >= (threshold as any).absoluteDifference || 
           relativeDiff >= (threshold as any).relativeDifference;
  }
  
  // For revenue and engagement, check percentage difference
  const percentDiff = value2 > 0 ? Math.abs((value1 - value2) / value2) : 0;
  return percentDiff >= (threshold as any).percentDifference;
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Format percentage
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Calculate percentage change
export function percentageChange(oldValue: number, newValue: number): string {
  if (oldValue === 0) return newValue > 0 ? '+100%' : '0%';
  const change = ((newValue - oldValue) / oldValue) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
}

// Find top performers by a metric
export function findTopPerformers<T>(
  items: T[],
  getValue: (item: T) => number,
  count: number = 3
): T[] {
  return [...items]
    .sort((a, b) => getValue(b) - getValue(a))
    .slice(0, count);
}

// Group items by a key
export function groupBy<T>(
  items: T[],
  getKey: (item: T) => string
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  items.forEach(item => {
    const key = getKey(item);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });
  
  return grouped;
}

// Detect anomalies (values that are significantly above normal)
export function detectAnomalies(
  values: { date: Date; value: number; label?: string }[],
  threshold: number = 3 // standard deviations
): typeof values {
  if (values.length < 3) return [];
  
  const numbers = values.map(v => v.value);
  const avg = average(numbers);
  const stdDev = standardDeviation(numbers);
  
  if (stdDev === 0) return [];
  
  return values.filter(v => {
    const zScore = Math.abs((v.value - avg) / stdDev);
    return zScore > threshold;
  });
}

// Subject line analysis utilities
export function analyzeSubjectLine(subject: string): {
  length: number;
  hasEmoji: boolean;
  hasUrgency: boolean;
  hasNumber: boolean;
  hasQuestion: boolean;
  hasDiscount: boolean;
} {
  const urgencyWords = [
    'urgent', 'limited', 'ending', 'last', 'final', 'today', 'tonight',
    'hours left', 'expires', 'deadline', 'hurry', 'quick', 'fast',
    'don\'t miss', 'act now', 'limited time', 'ends soon'
  ];
  
  const discountWords = [
    'sale', 'discount', 'off', '%', 'save', 'deal', 'offer',
    'clearance', 'reduced', 'special', 'promo', 'code'
  ];
  
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const numberRegex = /\d+/;
  
  const subjectLower = subject.toLowerCase();
  
  return {
    length: subject.length,
    hasEmoji: emojiRegex.test(subject),
    hasUrgency: urgencyWords.some(word => subjectLower.includes(word)),
    hasNumber: numberRegex.test(subject),
    hasQuestion: subject.includes('?'),
    hasDiscount: discountWords.some(word => subjectLower.includes(word))
  };
}

// Categorize campaign by theme based on name and subject
export function categorizeCampaignTheme(campaignName: string, subject: string): string {
  const combined = `${campaignName} ${subject}`.toLowerCase();
  
  const themePatterns = {
    'Sales/Promotional': ['sale', 'discount', 'off', '%', 'save', 'deal', 'offer', 'promo'],
    'Product Launch': ['new', 'launch', 'introducing', 'arrival', 'debut', 'release'],
    'Educational': ['how to', 'guide', 'tips', 'learn', 'tutorial', 'masterclass'],
    'Restock': ['back in stock', 'restock', 'available again', 'returned'],
    'Seasonal': ['holiday', 'christmas', 'black friday', 'cyber', 'summer', 'winter', 'spring', 'fall'],
    'Loyalty/VIP': ['vip', 'exclusive', 'member', 'loyalty', 'reward', 'early access']
  };
  
  for (const [theme, patterns] of Object.entries(themePatterns)) {
    if (patterns.some(pattern => combined.includes(pattern))) {
      return theme;
    }
  }
  
  return 'General';
}
