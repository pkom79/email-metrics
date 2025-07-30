# Context Builder - Real Data Integration

## Overview
The `contextBuilder.ts` creates enhanced context by combining user-provided business information with calculated metrics from actual email marketing data. This enriched context enables more accurate and relevant AI insights.

## Core Function
```typescript
generateEnhancedContext(userContext, campaigns, flows, subscribers, insights): EnhancedContext
```

## Input Processing

### User-Provided Context
- **Product Category**: Fashion & Apparel, Electronics, etc.
- **Price Range**: $50 - $100, Under $25, etc.  
- **Slowest Month**: February, January, etc.

### Real Data Sources
- **Campaigns**: Actual campaign performance data with revenue, open rates, etc.
- **Flows**: Automated email sequence data with position-based metrics
- **Subscribers**: Customer data with purchase history and engagement
- **Insights**: Pre-calculated insights from the 25 processor analyses

## Calculated Metrics

### Account Metrics
- **Average Order Value**: Calculated from total revenue / total orders across all emails
- **Purchase Frequency**: Derived from subscriber purchase patterns (one-time, occasional, regular, frequent)
- **List Size**: Count of active subscribers
- **Account Age**: Days since oldest campaign/flow
- **Monthly Email Volume**: Average emails sent per month

### Performance Benchmarks  
- **Average Open Rate**: Volume-weighted average across campaigns and flows
- **Average Click Rate**: Volume-weighted average across campaigns and flows
- **Revenue Per Email**: Total revenue / total emails sent
- **Account Tier**: 'struggling', 'average', 'good', 'excellent' based on industry benchmarks

### Detected Patterns
- **Primary Challenges**: Extracted from high-significance insights (e.g., "high unsubscribe rate")
- **Opportunities**: Identified from positive insights with high confidence
- **Seasonality Strength**: Calculated coefficient of variation for monthly revenue
- **Content Themes**: Extracted from top-performing campaign subject lines

## Key Algorithms

### Purchase Frequency Classification
```typescript
// Uses subscriber total revenue and average order value
const avgPurchaseCount = avgTotalRevenue / avgOrderValue
// Classifications: one-time (≤1.2), occasional (≤2.5), regular (≤5), frequent (>5)
```

### Account Tier Scoring
```typescript
// Weighted scoring system:
// Open Rate (40%): ≥25% = excellent, ≥20% = good, ≥15% = average, <15% = struggling  
// Click Rate (35%): ≥4% = excellent, ≥2.5% = good, ≥1.5% = average, <1.5% = struggling
// Revenue/Email (25%): ≥$0.50 = excellent, ≥$0.25 = good, ≥$0.10 = average, <$0.10 = struggling
```

### Challenge Detection
```typescript
// Analyzes insights with significance > 0.6:
// - subscriber-health + "Decline" → "subscriber engagement declining"
// - performance-issues → "campaign performance issues"  
// - "Unsubscribe" + significance > 0.5 → "high unsubscribe rate"
// - timing-optimization + significance > 0.7 → "suboptimal send timing"
```

### Content Theme Extraction
```typescript
// Pattern matching on top 25% performing campaign subjects:
const themePatterns = {
  'promotional': /sale|discount|off|deal|promo|save|%/,
  'seasonal': /holiday|summer|winter|spring|fall|christmas/,
  'urgency': /limited|hurry|today|now|urgent|deadline|expires/,
  'social-proof': /bestseller|popular|trending|favorite|loved/,
  'personal': /you|your|personal|custom|exclusive|just for you/,
  'product-focused': /new|launch|collection|product|item|arrival/,
  'educational': /how|tips|guide|learn|discover|unlock|secret/,
  'value': /free|bonus|gift|value|worth|included/
}
```

### Seasonality Calculation
```typescript
// Groups revenue by month, calculates coefficient of variation
const coefficientOfVariation = standardDeviation / mean
// Classifications: >0.5 = strong, >0.3 = moderate, >0.15 = weak, ≤0.15 = none
```

## Enhanced Context Output

```typescript
{
  // User provided
  productCategory: "Fashion & Apparel",
  priceRange: "$50 - $100", 
  slowestMonth: "February",
  
  // Calculated from data
  accountMetrics: {
    avgOrderValue: 67.89,
    purchaseFrequency: "occasional", 
    listSize: 4,
    accountAge: 45,
    monthlyEmailVolume: 11500
  },
  
  performance: {
    avgOpenRate: 28.5,
    avgClickRate: 5.25,
    avgRevenuePerEmail: 0.35,
    accountTier: "good"
  },
  
  detectedPatterns: {
    primaryChallenges: ["high unsubscribe rate", "engagement optimization needed"],
    opportunities: ["timing optimization potential", "strong content performance foundation"],
    seasonalityStrength: "weak",
    topContentThemes: ["promotional", "urgency", "personal"]
  }
}
```

## Integration Points

### With AI Insight Generation
The enhanced context is passed to insight processors to provide:
- Industry-specific recommendations based on product category
- Price-point appropriate strategies based on price range
- Seasonal awareness using slowest month data
- Performance-relative suggestions based on account tier

### With Dashboard UI
The context collection modal gathers user input that gets enhanced with:
- Real-time calculated metrics from user's actual data
- Performance benchmarks relative to their account history
- Automatically detected optimization opportunities

## Data Validation

The context builder includes robust error handling:
- Handles empty data arrays gracefully
- Provides fallback values for missing metrics
- Validates data types and ranges
- Ensures calculations don't divide by zero

## Performance Considerations

- Processes data in-memory for fast calculation
- Uses efficient array operations and reduce functions
- Caches expensive calculations where possible
- Minimal external dependencies for Deno compatibility

## Usage in Production

```typescript
import { generateEnhancedContext } from './enrichment/contextBuilder.ts'

// In your insight generation pipeline:
const userContext = await getUserContextFromModal()
const campaigns = await getCampaignsFromDatabase()
const flows = await getFlowsFromDatabase() 
const subscribers = await getSubscribersFromDatabase()
const insights = await getExistingInsights()

const enhancedContext = generateEnhancedContext(
  userContext, campaigns, flows, subscribers, insights
)

// Pass to AI insight processors for context-aware analysis
const aiInsights = await generateContextualInsights(enhancedContext)
```

This context builder transforms basic user input into rich, data-driven context that enables highly personalized and accurate AI insights for email marketing optimization.
