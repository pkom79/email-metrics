// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import type { ProcessingRequest, InsightResult } from "../shared/types.ts"
import { CampaignProcessor } from "./processors/campaignProcessor.ts"
import { FlowProcessor } from "./processors/flowProcessor.ts"
import { SubscriberProcessor } from "./processors/subscriberProcessor.ts"
import { HealthProcessor } from "./processors/healthProcessor.ts"
import { RevenueProcessor } from "./processors/revenueProcessor.ts"
import { createProgressTracker, ProgressTracker } from "./utils/progressTracker.ts"

// Initialize Supabase client
// @ts-ignore - Deno environment access
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
// @ts-ignore - Deno environment access
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

interface OrchestrationResponse {
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

async function updateJobProgress(jobId: string, progress: number, statusMessage: string) {
  try {
    const { error } = await supabase
      .from('processing_jobs')
      .update({
        progress,
        status_message: statusMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (error) {
      console.error('Failed to update job progress:', error)
    }
  } catch (error) {
    console.error('Error updating job progress:', error)
  }
}

async function orchestrateInsights(requestData: ProcessingRequest): Promise<OrchestrationResponse> {
  const startTime = Date.now()
  const { campaigns, flows, subscribers, context, dateRange, jobId } = requestData
  
  // Initialize progress tracker
  const dataMetrics = {
    campaigns: campaigns.length,
    flows: flows.length,
    subscribers: subscribers.length
  }
  const progressTracker = createProgressTracker(jobId, dataMetrics)
  
  try {
    // Start data validation
    await progressTracker.updateProgress('validation')
    
    // Filter data to last 90 days if needed
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)
    
    const filteredCampaigns = campaigns.map(c => ({
      ...c,
      sentDate: new Date(c.sentDate)
    })).filter(c => c.sentDate >= cutoffDate)
    
    const filteredFlows = flows.map(f => ({
      ...f,
      sentDate: new Date(f.sentDate)
    })).filter(f => f.sentDate >= cutoffDate)
    
    const filteredSubscribers = subscribers.map(s => ({
      ...s,
      subscriptionDate: new Date(s.subscriptionDate),
      lastOrderDate: s.lastOrderDate ? new Date(s.lastOrderDate) : undefined
    }))

    // Initialize processors
    const campaignProcessor = new CampaignProcessor(filteredCampaigns)
    const flowProcessor = new FlowProcessor(filteredFlows, filteredCampaigns)
    const subscriberProcessor = new SubscriberProcessor(filteredSubscribers, filteredCampaigns, filteredFlows)
    const healthProcessor = new HealthProcessor(filteredCampaigns, filteredFlows)
    const revenueProcessor = new RevenueProcessor(filteredCampaigns, filteredFlows)

    // Campaign insights processing
    await progressTracker.updateProgress('campaign-insights')
    const campaignInsights = await Promise.all([
      campaignProcessor.analyzeSubjectLineRevenueDrivers(),
      campaignProcessor.analyzeCampaignSpacingImpact(),
      campaignProcessor.findZeroOrderHighEngagement(),
      campaignProcessor.analyzeCampaignThemePerformance(),
      campaignProcessor.detectPerfectCampaignRecipe()
    ])

    // Flow insights processing
    await progressTracker.updateProgress('flow-insights')
    const flowInsights = await Promise.all([
      flowProcessor.identifyFlowEmailsToCut(),
      flowProcessor.analyzeFlowVsCampaignBalance(),
      flowProcessor.analyzeFlowPerformanceByPosition(),
      flowProcessor.analyzeDayOfWeekFlowPerformance(),
      flowProcessor.analyzeListSizeImpactOnFlows()
    ])

    // Subscriber insights processing
    await progressTracker.updateProgress('subscriber-insights')
    const subscriberInsights = await Promise.all([
      subscriberProcessor.detectSubscriberDecay(),
      subscriberProcessor.analyzeSubscriberLifecycle(),
      subscriberProcessor.analyzeHighValueEngagement(),
      subscriberProcessor.analyzeListGrowthVsQuality(),
      subscriberProcessor.analyzeNewSubscriberEngagement()
    ])

    // Revenue insights processing
    await progressTracker.updateProgress('revenue-insights')
    const revenueInsights = await Promise.all([
      revenueProcessor.findMoneyMakingTimeWindows(),
      revenueProcessor.analyzeRevenueConcentration(),
      revenueProcessor.analyzeRevenuePerEmailTrend(),
      revenueProcessor.analyzeDayOfWeekReliability(),
      revenueProcessor.analyzeRevenueClusteringByTime(),
      revenueProcessor.analyzeCampaignPerformanceBySize(),
      revenueProcessor.analyzeClickToPurchaseDropoff()
    ])

    // Health insights processing
    await progressTracker.updateProgress('health-insights')
    const healthInsights = await Promise.all([
      healthProcessor.detectCampaignFatigue(),
      healthProcessor.analyzeBounceRateTrend(),
      healthProcessor.analyzeSpamBySize()
    ])

    // Context generation phase
    await progressTracker.updateProgress('context-generation')

    // Organize results
    await progressTracker.updateProgress('formatting')
    
    const insights = {
      campaign: campaignInsights,
      flow: flowInsights,
      subscriber: subscriberInsights,
      health: healthInsights,
      revenue: revenueInsights
    }

    const totalInsights = campaignInsights.length + flowInsights.length + subscriberInsights.length + healthInsights.length + revenueInsights.length
    const processingTime = Date.now() - startTime

    // Mark as complete
    await progressTracker.markComplete()

    // Update job status in database
    await supabase
      .from('processing_jobs')
      .update({
        status: 'completed',
        result: {
          totalInsights,
          successfulInsights: totalInsights,
          failedInsights: 0,
          processingTime
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    return {
      success: true,
      jobId,
      insights,
      metadata: {
        totalInsights,
        successfulInsights: totalInsights,
        failedInsights: [],
        processingTime,
        dateRange
      }
    }

  } catch (error) {
    await progressTracker.markError(error.message)
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse and validate request body
    const requestData: ProcessingRequest = await req.json()
    
    // Basic validation
    if (!requestData.campaigns || !requestData.flows || !requestData.subscribers) {
      return new Response(
        JSON.stringify({ error: 'Missing required data: campaigns, flows, or subscribers' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!requestData.dateRange || !requestData.accountId || !requestData.jobId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: dateRange, accountId, or jobId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate data arrays
    if (!Array.isArray(requestData.campaigns) || !Array.isArray(requestData.flows) || !Array.isArray(requestData.subscribers)) {
      return new Response(
        JSON.stringify({ error: 'Invalid data format: campaigns, flows, and subscribers must be arrays' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Processing insights for account ${requestData.accountId}, job ${requestData.jobId}`)
    console.log(`Data received: ${requestData.campaigns.length} campaigns, ${requestData.flows.length} flows, ${requestData.subscribers.length} subscribers`)

    // Create initial job record
    try {
      const { error } = await supabase
        .from('processing_jobs')
        .update({
          status: 'running',
          progress: 0,
          status_message: 'Starting processing...',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestData.jobId)

      if (error) {
        console.error('Failed to create job record:', error)
      }
    } catch (error) {
      console.error('Error creating job record:', error)
    }

    // Orchestrate the insight processing
    const response = await orchestrateInsights(requestData)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing email insights:', error)
    
    // Update job status to failed
    try {
      if (error.jobId) {
        await supabase
          .from('processing_jobs')
          .update({
            status: 'failed',
            error: { message: error.message, stack: error.stack },
            updated_at: new Date().toISOString()
          })
          .eq('id', error.jobId)
      }
    } catch (dbError) {
      console.error('Error updating job failure:', dbError)
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
