// Progress Tracker Utility for AI Email Insights Analysis
// Provides real-time progress updates via Supabase Realtime

// @ts-ignore - Deno imports work in edge functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface ProgressStage {
  id: string
  name: string
  description: string
  percentage: number
  icon: string
  estimatedDuration: number // seconds
}

export interface ProgressUpdate {
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

// Define all analysis stages with their characteristics
export const PROGRESS_STAGES: ProgressStage[] = [
  {
    id: 'validation',
    name: 'Data Validation',
    description: 'Validating uploaded data and checking formats...',
    percentage: 5,
    icon: '🔍',
    estimatedDuration: 3
  },
  {
    id: 'campaign-insights', 
    name: 'Campaign Analysis',
    description: 'Analyzing campaign performance and optimization opportunities...',
    percentage: 20,
    icon: '📧',
    estimatedDuration: 8
  },
  {
    id: 'flow-insights',
    name: 'Flow Analysis', 
    description: 'Processing automated email flows and sequences...',
    percentage: 30,
    icon: '🔄',
    estimatedDuration: 8
  },
  {
    id: 'subscriber-insights',
    name: 'Subscriber Analysis',
    description: 'Evaluating subscriber behavior and segmentation...',
    percentage: 40,
    icon: '👥',
    estimatedDuration: 7
  },
  {
    id: 'revenue-insights',
    name: 'Revenue Analysis',
    description: 'Calculating revenue patterns and growth opportunities...',
    percentage: 50,
    icon: '💰',
    estimatedDuration: 6
  },
  {
    id: 'health-insights',
    name: 'Health Analysis',
    description: 'Assessing account health and engagement trends...',
    percentage: 60,
    icon: '📊',
    estimatedDuration: 5
  },
  {
    id: 'context-generation',
    name: 'Context Enhancement',
    description: 'Building enhanced business context for AI analysis...',
    percentage: 70,
    icon: '🧠',
    estimatedDuration: 4
  },
  {
    id: 'ai-starting',
    name: 'AI Initialization',
    description: 'Starting AI enhancement with o3/GPT-4o models...',
    percentage: 75,
    icon: '🚀',
    estimatedDuration: 3
  },
  {
    id: 'ai-processing',
    name: 'AI Analysis',
    description: 'AI is discovering hidden patterns and opportunities...',
    percentage: 90,
    icon: '🤖',
    estimatedDuration: 25
  },
  {
    id: 'formatting',
    name: 'Finalizing Results',
    description: 'Formatting insights and generating recommendations...',
    percentage: 95,
    icon: '✨',
    estimatedDuration: 3
  },
  {
    id: 'complete',
    name: 'Analysis Complete',
    description: 'Your comprehensive email insights are ready!',
    percentage: 100,
    icon: '🎉',
    estimatedDuration: 0
  }
]

export class ProgressTracker {
  private supabase: any
  private channelName: string
  private jobId: string
  private completedStages: string[] = []
  private startTime: number
  private dataMetrics: any

  constructor(jobId: string, dataMetrics?: any) {
    this.supabase = createClient(
      // @ts-ignore - Deno environment access
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore - Deno environment access
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    this.jobId = jobId
    this.channelName = `analysis-${jobId}`
    this.startTime = Date.now()
    this.dataMetrics = dataMetrics
  }

  async updateProgress(stageId: string): Promise<void> {
    try {
      const stage = PROGRESS_STAGES.find(s => s.id === stageId)
      if (!stage) {
        console.error(`Unknown stage: ${stageId}`)
        return
      }

      // Mark stage as completed
      if (!this.completedStages.includes(stageId)) {
        this.completedStages.push(stageId)
      }

      // Calculate estimated time remaining
      const elapsedSeconds = (Date.now() - this.startTime) / 1000
      const remainingStages = PROGRESS_STAGES.filter(s => 
        s.percentage > stage.percentage && s.id !== 'complete'
      )
      const estimatedTimeRemaining = remainingStages.reduce(
        (sum, s) => sum + s.estimatedDuration, 0
      )

      // Adjust estimate based on data size
      const adjustedTimeRemaining = this.adjustTimeEstimate(
        estimatedTimeRemaining, 
        stageId
      )

      const progressUpdate: ProgressUpdate = {
        jobId: this.jobId,
        currentStage: stageId,
        percentage: stage.percentage,
        stageName: stage.name,
        stageDescription: stage.description,
        estimatedTimeRemaining: Math.max(0, adjustedTimeRemaining),
        completedStages: [...this.completedStages],
        dataMetrics: this.dataMetrics
      }

      // Broadcast progress update via Realtime
      await this.supabase.channel(this.channelName).send({
        type: 'broadcast',
        event: 'progress',
        payload: progressUpdate
      })

      // Update processing_jobs table
      await this.updateJobRecord(progressUpdate)

      console.log(`Progress update: ${stage.name} (${stage.percentage}%)`)

    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  private adjustTimeEstimate(baseEstimate: number, currentStageId: string): number {
    if (!this.dataMetrics) return baseEstimate

    const { campaigns = 0, flows = 0, subscribers = 0 } = this.dataMetrics
    const totalDataPoints = campaigns + flows + subscribers

    // Adjust based on data volume
    let multiplier = 1
    if (totalDataPoints > 10000) multiplier = 1.5
    else if (totalDataPoints > 5000) multiplier = 1.2
    else if (totalDataPoints > 1000) multiplier = 1.1

    // AI processing stage gets additional time for complex analysis
    if (currentStageId === 'ai-processing') {
      multiplier *= 1.3 // AI takes longer for thorough analysis
    }

    return Math.round(baseEstimate * multiplier)
  }

  private async updateJobRecord(progress: ProgressUpdate): Promise<void> {
    try {
      await this.supabase
        .from('processing_jobs')
        .update({
          current_stage: progress.currentStage,
          stages_completed: progress.completedStages,
          estimated_completion: new Date(Date.now() + (progress.estimatedTimeRemaining * 1000)).toISOString(),
          data_metrics: progress.dataMetrics,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.jobId)
    } catch (error) {
      console.error('Failed to update job record:', error)
    }
  }

  async markError(error: string): Promise<void> {
    try {
      const errorUpdate: ProgressUpdate = {
        jobId: this.jobId,
        currentStage: 'error',
        percentage: 0,
        stageName: 'Analysis Failed',
        stageDescription: `Error: ${error}`,
        estimatedTimeRemaining: 0,
        completedStages: this.completedStages,
        dataMetrics: this.dataMetrics
      }

      await this.supabase.channel(this.channelName).send({
        type: 'broadcast',
        event: 'error',
        payload: errorUpdate
      })

      await this.supabase
        .from('processing_jobs')
        .update({
          status: 'failed',
          error_message: error,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.jobId)

    } catch (broadcastError) {
      console.error('Failed to broadcast error:', broadcastError)
    }
  }

  async markComplete(): Promise<void> {
    await this.updateProgress('complete')
    
    // Update final job status
    await this.supabase
      .from('processing_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', this.jobId)
  }

  // Helper method to create stage timing estimates based on processor types
  static getProcessorStageMapping(): Record<string, string> {
    return {
      // Campaign processor insights map to campaign-insights stage
      'campaign-subject-line-analysis': 'campaign-insights',
      'campaign-send-time-optimization': 'campaign-insights', 
      'campaign-content-performance': 'campaign-insights',
      'campaign-audience-engagement': 'campaign-insights',
      'campaign-conversion-optimization': 'campaign-insights',

      // Flow processor insights map to flow-insights stage
      'flow-emails-to-cut': 'flow-insights',
      'flow-vs-campaign-balance': 'flow-insights',
      'flow-performance-by-position': 'flow-insights',
      'day-of-week-flow-performance': 'flow-insights',
      'list-size-impact-on-flows': 'flow-insights',

      // Subscriber processor insights map to subscriber-insights stage
      'subscriber-lifecycle-analysis': 'subscriber-insights',
      'subscriber-decay-patterns': 'subscriber-insights',
      'engagement-by-subscriber-age': 'subscriber-insights',
      'high-value-subscriber-identification': 'subscriber-insights',
      'subscriber-reactivation-opportunities': 'subscriber-insights',

      // Revenue processor insights map to revenue-insights stage
      'revenue-per-subscriber-trends': 'revenue-insights',
      'monthly-revenue-patterns': 'revenue-insights',
      'product-performance-analysis': 'revenue-insights',
      'customer-lifetime-value-segments': 'revenue-insights',
      'seasonal-revenue-optimization': 'revenue-insights',

      // Health processor insights map to health-insights stage
      'overall-account-health': 'health-insights',
      'engagement-trend-analysis': 'health-insights',
      'deliverability-health-check': 'health-insights',
      'list-growth-health': 'health-insights',
      'performance-decline-alerts': 'health-insights'
    }
  }
}

// Utility function to create progress tracker instance
export function createProgressTracker(
  jobId: string, 
  dataMetrics?: { campaigns: number; flows: number; subscribers: number }
): ProgressTracker {
  return new ProgressTracker(jobId, dataMetrics)
}
