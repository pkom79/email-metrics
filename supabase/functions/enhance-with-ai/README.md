# AI Enhancement Edge Function Configuration

## Environment Variables Required

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration  
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment Commands

```bash
# Deploy to Supabase
supabase functions deploy enhance-with-ai

# Set environment variables
supabase secrets set OPENAI_API_KEY=your_key_here
supabase secrets set SUPABASE_URL=your_url_here  
supabase secrets set SUPABASE_ANON_KEY=your_key_here
```

## API Usage

### Request Format
```typescript
POST /functions/v1/enhance-with-ai
Content-Type: application/json

{
  "insights": InsightResult[],      // Array of 25 calculated insights
  "enhancedContext": EnhancedContext, // User + calculated context
  "accountId": string               // Account identifier
}
```

### Response Format
```typescript
{
  "success": true,
  "analysis": EnhancedAnalysis,
  "timestamp": "2024-07-30T12:00:00Z"
}
```

## Integration with Dashboard

```typescript
// In your React component
const enhanceWithAI = async (insights, context) => {
  const response = await fetch('/functions/v1/enhance-with-ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseToken}`
    },
    body: JSON.stringify({
      insights,
      enhancedContext: context,
      accountId: 'user_account_id'
    })
  });
  
  return await response.json();
};
```

## AI Model Configuration

- **Primary**: o3 (temperature: 0.2, max_tokens: 8000)
- **Fallback**: GPT-4o (temperature: 0.3, max_tokens: 8000)  
- **Automatic switching** on API errors or rate limits

## Response Structure

### Enhanced Insights
Each original insight gets AI enhancement with:
- Deeper causal analysis
- Root cause identification  
- Predictive impact assessment
- Specific action recommendations

### Custom Discoveries
AI identifies 3-5 unique insights beyond standard analysis:
- Business-specific patterns
- Industry opportunities
- Competitive advantages
- Revenue optimization strategies

### Strategic Synthesis
- Biggest opportunity with estimated impact
- Primary risk requiring attention
- 3-5 prioritized actions with ROI/timeframe/effort

## Error Handling

- Model unavailable → automatic fallback
- Rate limits → retry with exponential backoff
- Parse errors → fallback structure with original insights
- Missing data → validation errors with helpful messages

## Performance Expectations

- **o3 Analysis**: 15-30 seconds (higher quality)
- **GPT-4o Analysis**: 10-20 seconds (reliable fallback)
- **Response Size**: ~50-100KB structured JSON
- **Concurrent Requests**: Limited by OpenAI rate limits

## Testing

```bash
# Test locally (requires Deno)
deno run --allow-net --allow-env test-ai-enhancement.ts

# Test deployed function
curl -X POST https://your-project.supabase.co/functions/v1/enhance-with-ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @test-payload.json
```

## Security Considerations

- API keys stored securely in Supabase secrets
- CORS configured for your domain only in production
- Rate limiting handled by OpenAI
- Request/response logging for debugging

## Monitoring

- Function execution logs in Supabase dashboard
- OpenAI usage tracking in OpenAI dashboard  
- Error alerts for failed enhancements
- Performance metrics for response times
