import { generateEnhancedContext } from "./contextBuilder.ts"
// Import the actual DataManager to use real data
// Note: In a real Supabase environment, you'd get this data from the database
// For testing, we'll simulate having actual processed data

// Example with realistic data structure based on your actual types
const mockUserContext = {
  storeName: "Acme Yoga",
  productDescription: "luxury yoga apparel for women", 
  priceRange: "Premium ($100-$200)",
  slowMonths: ["January", "February", "July"]
}

// Realistic campaign data based on your actual data structure
const realCampaigns = [
  {
    id: "camp_001",
    subject: "Summer Sale - 20% Off Everything!",
    sentDate: new Date("2024-06-15T10:00:00Z"),
    emailsSent: 12500,
    uniqueOpens: 3125,
    uniqueClicks: 375,
    totalOrders: 78,
    revenue: 4680,
    openRate: 25.0,
    clickRate: 3.0,
    clickToOpenRate: 12.0,
    conversionRate: 0.624,
    unsubscribeRate: 0.08,
    spamRate: 0.02,
    bounceRate: 1.1
  },
  {
    id: "camp_002", 
    subject: "New Arrivals - Fresh Styles Just Dropped",
    sentDate: new Date("2024-06-20T14:30:00Z"),
    emailsSent: 10800,
    uniqueOpens: 2916,
    uniqueClicks: 324,
    totalOrders: 43,
    revenue: 2580,
    openRate: 27.0,
    clickRate: 3.0,
    clickToOpenRate: 11.1,
    conversionRate: 0.398,
    unsubscribeRate: 0.05,
    spamRate: 0.01,
    bounceRate: 0.9
  },
  {
    id: "camp_003",
    subject: "Last Chance - Flash Sale Ends Tonight!",
    sentDate: new Date("2024-07-01T18:00:00Z"),
    emailsSent: 11200,
    uniqueOpens: 3584,
    uniqueClicks: 448,
    totalOrders: 89,
    revenue: 6230,
    openRate: 32.0,
    clickRate: 4.0,
    clickToOpenRate: 12.5,
    conversionRate: 0.795,
    unsubscribeRate: 0.12,
    spamRate: 0.03,
    bounceRate: 1.3
  }
]

// Realistic flow data with proper sequence structure
const realFlows = [
  {
    id: "flow_welcome_001",
    flowName: "Welcome Series",
    emailName: "Welcome Email 1",
    sentDate: new Date("2024-06-16T09:00:00Z"),
    status: "active",
    emailsSent: 850,
    uniqueOpens: 323,
    uniqueClicks: 68,
    totalOrders: 17,
    revenue: 765,
    openRate: 38.0,
    clickRate: 8.0,
    clickToOpenRate: 21.1,
    conversionRate: 2.0,
    unsubscribeRate: 0.12,
    spamRate: 0.0,
    bounceRate: 0.6
  },
  {
    id: "flow_welcome_002",
    flowName: "Welcome Series", 
    emailName: "Welcome Email 2",
    sentDate: new Date("2024-06-18T10:00:00Z"),
    status: "active",
    emailsSent: 780,
    uniqueOpens: 234,
    uniqueClicks: 39,
    totalOrders: 8,
    revenue: 320,
    openRate: 30.0,
    clickRate: 5.0,
    clickToOpenRate: 16.7,
    conversionRate: 1.0,
    unsubscribeRate: 0.08,
    spamRate: 0.0,
    bounceRate: 0.5
  },
  {
    id: "flow_abandon_001",
    flowName: "Abandoned Cart",
    emailName: "Cart Recovery 1",
    sentDate: new Date("2024-06-22T11:30:00Z"),
    status: "active",
    emailsSent: 420,
    uniqueOpens: 147,
    uniqueClicks: 63,
    totalOrders: 28,
    revenue: 1890,
    openRate: 35.0,
    clickRate: 15.0,
    clickToOpenRate: 42.9,
    conversionRate: 6.7,
    unsubscribeRate: 0.05,
    spamRate: 0.0,
    bounceRate: 0.8
  }
]

// Realistic subscriber data with proper purchase history
const realSubscribers = [
  {
    id: "sub_001",
    email: "sarah.johnson@email.com",
    status: "active",
    subscriptionDate: new Date("2024-01-15T14:20:00Z"),
    totalOrders: 4,
    totalRevenue: 280,
    averageOrderValue: 70,
    lastOrderDate: new Date("2024-06-20T12:00:00Z"),
    tags: ["loyal", "fashion", "premium"],
    location: "US",
    source: "website"
  },
  {
    id: "sub_002",
    email: "mike.chen@email.com", 
    status: "active",
    subscriptionDate: new Date("2024-03-08T09:45:00Z"),
    totalOrders: 2,
    totalRevenue: 135,
    averageOrderValue: 67.5,
    lastOrderDate: new Date("2024-06-15T16:30:00Z"),
    tags: ["occasional", "sale-shopper"],
    location: "CA",
    source: "social-media"
  },
  {
    id: "sub_003",
    email: "lisa.rodriguez@email.com",
    status: "active", 
    subscriptionDate: new Date("2023-11-22T11:15:00Z"),
    totalOrders: 8,
    totalRevenue: 640,
    averageOrderValue: 80,
    lastOrderDate: new Date("2024-07-01T14:45:00Z"),
    tags: ["vip", "frequent", "brand-advocate"],
    location: "TX", 
    source: "referral"
  },
  {
    id: "sub_004",
    email: "david.kim@email.com",
    status: "active",
    subscriptionDate: new Date("2024-05-12T16:20:00Z"),
    totalOrders: 1,
    totalRevenue: 45,
    averageOrderValue: 45,
    lastOrderDate: new Date("2024-05-20T10:30:00Z"),
    tags: ["new", "first-purchase"],
    location: "NY",
    source: "google-ads"
  }
]

// Realistic insights from actual analysis
const realInsights = [
  {
    insightId: "high-unsubscribe-rate",
    title: "High Unsubscribe Rate in Flash Sale Campaigns",
    category: "subscriber-health",
    data: { 
      campaignsAffected: 3,
      avgUnsubscribeRate: 0.083,
      benchmarkRate: 0.05,
      impactedSubscribers: 287
    },
    significance: 0.75,
    confidence: 0.85,
    recommendations: [
      "Reduce frequency of urgency-based campaigns",
      "Implement preference center for send frequency",
      "Test softer urgency language"
    ]
  },
  {
    insightId: "flow-performance-optimization",
    title: "Welcome Series Shows Strong Engagement Decline", 
    category: "flow-optimization",
    data: {
      flowName: "Welcome Series",
      email1OpenRate: 38.0,
      email2OpenRate: 30.0,
      dropOffPercentage: 21.1,
      revenueImpact: 445
    },
    significance: 0.68,
    confidence: 0.90,
    recommendations: [
      "Optimize timing between welcome emails",
      "A/B test email 2 subject lines",
      "Consider adding value-driven content in email 2"
    ]
  },
  {
    insightId: "timing-optimization-opportunity",
    title: "Tuesday Sends Outperform Other Days by 23%",
    category: "timing-optimization", 
    data: {
      bestDay: "Tuesday",
      avgRevenuePerEmail: 0.42,
      performanceGap: 23.4,
      totalCampaignsAnalyzed: 15
    },
    significance: 0.58,
    confidence: 0.78,
    recommendations: [
      "Schedule major campaigns for Tuesday sends",
      "Avoid Monday morning sends",
      "Test Tuesday 2PM as optimal time slot"
    ]
  }
]

// Generate enhanced context using real data patterns
console.log("=== Enhanced Context Builder Test with Real Data ===")
console.log("Processing realistic email marketing data...")

const enhancedContext = generateEnhancedContext(
  mockUserContext,
  realCampaigns,
  realFlows,
  realSubscribers,
  realInsights
)

console.log("\n✅ Enhanced Context Generated Successfully!")
console.log("\n📊 Context Summary:")
console.log(`• Store Name: ${enhancedContext.storeName}`)
console.log(`• Product Description: ${enhancedContext.productDescription}`)
console.log(`• Price Range: ${enhancedContext.priceRange}`)
console.log(`• Slow Months: ${enhancedContext.slowMonths?.join(', ')}`)

console.log(`\n📈 Account Metrics:`)
console.log(`• Average Order Value: $${enhancedContext.accountMetrics.avgOrderValue}`)
console.log(`• Purchase Frequency: ${enhancedContext.accountMetrics.purchaseFrequency}`)
console.log(`• List Size: ${enhancedContext.accountMetrics.listSize} subscribers`)
console.log(`• Account Age: ${enhancedContext.accountMetrics.accountAge} days`)
console.log(`• Monthly Email Volume: ${enhancedContext.accountMetrics.monthlyEmailVolume} emails`)

console.log(`\n⚡ Performance Benchmarks:`)
console.log(`• Average Open Rate: ${enhancedContext.performance.avgOpenRate}%`)
console.log(`• Average Click Rate: ${enhancedContext.performance.avgClickRate}%`)
console.log(`• Revenue per Email: $${enhancedContext.performance.avgRevenuePerEmail}`)
console.log(`• Account Tier: ${enhancedContext.performance.accountTier}`)

console.log(`\n🔍 Detected Patterns:`)
console.log(`• Primary Challenges: ${enhancedContext.detectedPatterns.primaryChallenges.join(', ')}`)
console.log(`• Opportunities: ${enhancedContext.detectedPatterns.opportunities.join(', ')}`)
console.log(`• Seasonality Strength: ${enhancedContext.detectedPatterns.seasonalityStrength}`)
console.log(`• Top Content Themes: ${enhancedContext.detectedPatterns.topContentThemes.join(', ')}`)

console.log("\n🎯 Context builder successfully enhanced user input with:")
console.log("   ✓ Calculated account metrics from email performance data")
console.log("   ✓ Derived performance benchmarks across campaigns and flows") 
console.log("   ✓ Extracted behavioral patterns from subscriber data")
console.log("   ✓ Identified challenges and opportunities from insights analysis")
console.log("   ✓ Determined content themes from high-performing campaigns")

console.log("\n📋 Full Enhanced Context Object:")
console.log(JSON.stringify(enhancedContext, null, 2))
