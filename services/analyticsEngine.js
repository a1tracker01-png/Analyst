/**
 * Analytics Engine for Reels Filtering, Sorting, and Fast-Boom Detection
 */

// Timeframe cutoffs in hours
const TIMEFRAMES = {
  '24h': 24,
  '2d': 48,
  '4d': 96,
  '1w': 168,
  'all': Infinity
};

/**
 * Filter reels by specific timeframe
 */
function filterReelsByTimeframe(reels, timeframeKey) {
  if (!timeframeKey || timeframeKey === 'all') return reels;
  const maxHours = TIMEFRAMES[timeframeKey] || 168;
  return reels.filter(r => r.ageHours <= maxHours);
}

/**
 * Enrich reels with computed metrics:
 * - Engagement rate
 * - Velocity (views / hour)
 * - Outlier multiplier (views / creator.avgViews)
 * - Boom status and viral score
 */
function enrichReelMetrics(reel) {
  const views = reel.views || 0;
  const likes = reel.likes || 0;
  const comments = reel.comments || 0;
  const ageHours = Math.max(0.5, reel.ageHours || 1);
  const avgViews = reel.creator?.avgViews || 120000;

  // Engagement rate as a percentage of views
  const engagementRate = views > 0 ? parseFloat((((likes + comments) / views) * 100).toFixed(2)) : 0;
  
  // Velocity = views per hour
  const velocity = Math.round(views / ageHours);

  // Outlier multiplier = how many times higher than creator's usual average
  const outlierMultiplier = parseFloat((views / Math.max(1, avgViews)).toFixed(2));

  // Viral Score (0 - 100)
  // Higher weight on outlier multiplier and velocity relative to age
  let viralScore = Math.min(100, Math.round(
    (Math.min(outlierMultiplier, 4) / 4) * 50 +
    (Math.min(velocity, 50000) / 50000) * 35 +
    (Math.min(engagementRate, 10) / 10) * 15
  ));

  let boomLevel = 'NORMAL';
  let boomBadge = 'Normal Pace';
  let isBoom = false;

  if (outlierMultiplier >= 2.5 || (velocity >= 25000 && ageHours <= 48)) {
    boomLevel = 'SUPERNOVA';
    boomBadge = '🔥 SUPERNOVA BOOM';
    isBoom = true;
  } else if (outlierMultiplier >= 1.7 || (velocity >= 10000 && ageHours <= 48)) {
    boomLevel = 'FAST_BOOM';
    boomBadge = '⚡ FAST BOOM ALERT';
    isBoom = true;
  } else if (outlierMultiplier >= 1.25 || (velocity >= 4000 && ageHours <= 96)) {
    boomLevel = 'TRENDING';
    boomBadge = '🚀 RISING TREND';
    isBoom = true;
  }

  // Early signal flag: posted under 48 hours and booming
  const isEarlySignal = isBoom && ageHours <= 48;

  return {
    ...reel,
    engagementRate,
    velocity,
    outlierMultiplier,
    viralScore,
    boomLevel,
    boomBadge,
    isBoom,
    isEarlySignal
  };
}

/**
 * Sort reels by selected criteria
 */
function sortReels(reels, sortBy) {
  const list = [...reels];
  switch (sortBy) {
    case 'views':
      // Most Popular / Sort by Views
      return list.sort((a, b) => b.views - a.views);
    case 'engagement':
      // Sort by Engagement Rate %
      return list.sort((a, b) => b.engagementRate - a.engagementRate);
    case 'velocity':
      // Sort by Velocity (Views/hr)
      return list.sort((a, b) => b.velocity - a.velocity);
    case 'viralScore':
      // Sort by Viral / Boom score
      return list.sort((a, b) => b.viralScore - a.viralScore);
    case 'likes':
      return list.sort((a, b) => b.likes - a.likes);
    case 'recent':
    default:
      return list.sort((a, b) => a.ageHours - b.ageHours);
  }
}

/**
 * Filter and extract Fast-Boom alert reels
 */
function extractFastBoomReels(allReels) {
  const enriched = allReels.map(enrichReelMetrics);
  
  // Filter for reels with boom flag or high velocity in short window
  const boomAlerts = enriched.filter(r => r.isBoom || (r.velocity >= 5000 && r.ageHours <= 48));

  // Sort by highest velocity / viral score first
  return boomAlerts.sort((a, b) => (b.viralScore * 10000 + b.velocity) - (a.viralScore * 10000 + a.velocity));
}

module.exports = {
  TIMEFRAMES,
  filterReelsByTimeframe,
  enrichReelMetrics,
  sortReels,
  extractFastBoomReels
};
