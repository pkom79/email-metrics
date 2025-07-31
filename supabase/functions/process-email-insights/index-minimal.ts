import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("MINIMAL DIAGNOSTIC: Function loaded")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('ENTRY: Function called')
  
  try {
    if (req.method === 'OPTIONS') {
      console.log('OPTIONS: Handled')
      return new Response('ok', { headers: corsHeaders })
    }

    console.log('STEP 1: About to parse JSON')
    const body = await req.json()
    console.log('STEP 1: JSON parsed OK')

    console.log('STEP 2: Checking data')
    console.log('Body type:', typeof body)
    console.log('STEP 2: Data check OK')

    console.log('SUCCESS: All steps passed')
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Minimal diagnostic OK',
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )

  } catch (error) {
    console.error('ERROR:', error.name, error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.name,
        message: error.message,
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
