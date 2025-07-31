import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("🔍 DIAGNOSTIC MODE: Edge Function 546 Error Investigation")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('� Function started - checking request')
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log(' Step 1: Parsing request body...')
    const body = await req.json()
    console.log('✅ Step 1 PASSED: Body parsed successfully')
    
    console.log('📊 Step 2: Analyzing data structure...')
    console.log('Data received:', {
      campaigns: body.campaigns?.length || 0,
      campaignsType: typeof body.campaigns,
      firstCampaign: body.campaigns?.[0] ? Object.keys(body.campaigns[0]) : 'none',
      flows: body.flows?.length || 0,
      subscribers: body.subscribers?.length || 0
    })
    console.log('✅ Step 2 PASSED: Data structure analyzed')

    if (body.campaigns && body.campaigns.length > 0) {
      console.log('🗓️ Step 3: Testing date conversion...')
      const firstCampaign = body.campaigns[0]
      console.log('First campaign sentDate:', firstCampaign.sentDate, typeof firstCampaign.sentDate)
      
      const dateObj = new Date(firstCampaign.sentDate)
      console.log('✅ Step 3 PASSED: Date conversion successful:', dateObj.toISOString())
    } else {
      console.log('⚠️ Step 3 SKIPPED: No campaigns to test')
    }

    console.log('🎉 ALL DIAGNOSTIC TESTS PASSED')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Diagnostic test completed successfully',
        dataReceived: {
          campaigns: body.campaigns?.length || 0,
          flows: body.flows?.length || 0,
          subscribers: body.subscribers?.length || 0
        },
        timestamp: new Date().toISOString(),
        testsPassed: 3
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )

  } catch (error) {
    console.error('💥 DIAGNOSTIC FAILED:', error)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Function diagnostic failed',
        errorName: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
