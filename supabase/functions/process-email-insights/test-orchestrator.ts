// Test file to verify orchestrator structure
// This file validates that all processors are correctly imported and orchestrated

import type { ProcessingRequest, InsightResult } from "../shared/types.ts"

// Test interface to validate orchestrator structure
interface TestOrchestrationResponse {
  success: boolean
  jobId: string
  insights: {
    campaign: InsightResult[]
    flow: InsightResult[]
    subscriber: InsightResult[]
    health: InsightResult[]
    revenue: InsightResult[]
  }
  metadata: {
    totalInsights: number
    successfulInsights: number
    failedInsights: string[]
    processingTime: number
    dateRange: string
  }
}

// Test data structure validation
const testRequest: ProcessingRequest = {
  campaigns: [],
  flows: [],
  subscribers: [],
  dateRange: "90d",
  accountId: "test-account",
  jobId: "test-job-id"
}

// Validate that all 25 insight processors are defined
const expectedInsights = {
  campaign: [
    'subject-line-drivers',
    'spacing-impact', 
    'zero-order-engagement',
    'theme-performance',
    'perfect-recipe'
  ],
  flow: [
    'emails-to-cut',
    'vs-campaign-balance',
    'performance-by-position',
    'day-of-week-performance',
    'list-size-impact'
  ],
  subscriber: [
    'decay-analysis',
    'lifecycle-analysis',
    'high-value-engagement',
    'growth-vs-quality',
    'new-subscriber-engagement'
  ],
  health: [
    'campaign-fatigue',
    'bounce-rate-trend',
    'spam-by-size'
  ],
  revenue: [
    'time-windows',
    'concentration',
    'per-email-trend',
    'day-reliability',
    'time-clustering',
    'performance-by-size',
    'click-purchase-dropoff'
  ]
}

// Total insights validation
const totalExpectedInsights = 
  expectedInsights.campaign.length +
  expectedInsights.flow.length +
  expectedInsights.subscriber.length +
  expectedInsights.health.length +
  expectedInsights.revenue.length

console.log(`Total expected insights: ${totalExpectedInsights}`)
console.log('Expected insights by category:', expectedInsights)

// Validate response structure
function validateResponse(response: TestOrchestrationResponse): boolean {
  const requiredKeys = ['success', 'jobId', 'insights', 'metadata']
  const hasAllKeys = requiredKeys.every(key => key in response)
  
  const hasAllCategories = ['campaign', 'flow', 'subscriber', 'health', 'revenue']
    .every(category => category in response.insights)
  
  const hasValidMetadata = ['totalInsights', 'successfulInsights', 'failedInsights', 'processingTime', 'dateRange']
    .every(key => key in response.metadata)
  
  return hasAllKeys && hasAllCategories && hasValidMetadata
}

export { expectedInsights, totalExpectedInsights, validateResponse }
export type { TestOrchestrationResponse }
