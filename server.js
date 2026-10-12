const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const {
  scrapeCompetitorData,
  scraperConfig,
  fetchFromPublicInstagram,
  fetchLiveInstagramWebProfile,
  generateDynamicTechAIReels
} = require('./services/instagramScraper');
const {
  filterReelsByTimeframe,
  enrichReelMetrics,
  sortReels,
  extractFastBoomReels
} = require('./services/analyticsEngine');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Image proxy to prevent Instagram CDN CORS & hotlink 403 errors
app.get('/api/proxy-image', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Image URL is required');
  try {
    const targetUrl = decodeURIComponent(url);
    const fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/'
      }
    });
    if (fetchRes.ok) {
      const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=86400');
      const arrayBuffer = await fetchRes.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }
    return res.status(fetchRes.status).send('Failed to fetch image');
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

const DATA_DIR = path.join(__dirname, 'data');
const COMPETITORS_FILE = path.join(DATA_DIR, 'competitors.json');
const TECH_AI_FILE = path.join(DATA_DIR, 'tech_ai_creators.json');
const SAVED_IDEAS_FILE = path.join(DATA_DIR, 'saved_ideas.json');

// Helper to safely read JSON
function readJson(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

// Helper to write JSON
function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Cache of scraped reels in memory
let reelsCache = new Map(); // username -> array of reels
let lastCacheUpdate = 0;

/**
 * Sync or load reels for all competitors
 */
async function syncAllCompetitorsReels(force = false) {
  const competitors = readJson(COMPETITORS_FILE, []);
  for (const c of competitors) {
    if (!reelsCache.has(c.username) || force) {
      try {
        const scraped = await scrapeCompetitorData(c.username, force);
        if (scraped && scraped.reels) {
          reelsCache.set(c.username, scraped.reels);
        }
      } catch (e) {
        console.warn(`Error scraping @${c.username}:`, e.message);
      }
    }
  }
  lastCacheUpdate = Date.now();
}

/**
 * Daily Follower & Metric Sync Engine
 * Iterates through all tracked competitors, checks live Instagram follower counts,
 * detects increases/decreases, records history, and updates competitors.json.
 */
async function runDailyFollowerSync() {
  console.log('[DailySync] Starting daily competitor follower & profile synchronization...');
  const competitors = readJson(COMPETITORS_FILE, []);
  if (!competitors || competitors.length === 0) return { success: true, count: 0 };

  const todayStr = new Date().toISOString().split('T')[0];
  let updatedCount = 0;

  for (let i = 0; i < competitors.length; i++) {
    const c = competitors[i];
    try {
      console.log(`[DailySync] Checking live metrics for @${c.username}...`);
      const scraped = await scrapeCompetitorData(c.username, true);
      if (scraped && scraped.creator) {
        const live = scraped.creator;
        const prevFollowers = c.followers || 0;
        const currentFollowers = live.followers || prevFollowers;
        const followerDiff = currentFollowers - prevFollowers;

        c.previousFollowers = prevFollowers;
        c.followers = currentFollowers;
        c.followerChange = followerDiff;
        c.avatar = live.avatar || c.avatar;
        c.name = live.name || c.name;
        c.bio = live.bio || c.bio;
        c.following = live.following || c.following;
        c.totalReels = live.totalReels || c.totalReels;
        c.avgViews = live.avgViews || c.avgViews;
        c.avgEngagementRate = live.avgEngagementRate || c.avgEngagementRate;
        c.lastScraped = new Date().toISOString();
        c.lastDailySync = new Date().toISOString();

        // Update 30-day follower history
        c.followerHistory = c.followerHistory || [];
        const existingTodayIdx = c.followerHistory.findIndex(h => h.date === todayStr);
        if (existingTodayIdx !== -1) {
          c.followerHistory[existingTodayIdx].followers = currentFollowers;
          c.followerHistory[existingTodayIdx].change = followerDiff;
          c.followerHistory[existingTodayIdx].timestamp = Date.now();
        } else {
          c.followerHistory.push({
            date: todayStr,
            timestamp: Date.now(),
            followers: currentFollowers,
            change: followerDiff
          });
        }
        if (c.followerHistory.length > 30) {
          c.followerHistory = c.followerHistory.slice(-30);
        }

        competitors[i] = c;
        if (scraped.reels && scraped.reels.length > 0) {
          reelsCache.set(c.username, scraped.reels);
        }
        updatedCount++;
      }
    } catch (e) {
      console.warn(`[DailySync] Error updating @${c.username}:`, e.message);
    }
  }

  writeJson(COMPETITORS_FILE, competitors);
  console.log(`[DailySync] Completed daily sync for ${updatedCount}/${competitors.length} competitors.`);
  return { success: true, count: updatedCount, total: competitors.length, syncedAt: new Date().toISOString() };
}

// Background scheduler: runs every 24 hours (86,400,000 ms)
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
setInterval(() => {
  runDailyFollowerSync();
}, TWENTY_FOUR_HOURS_MS);

// Initial sync on startup
syncAllCompetitorsReels();

// ==========================================
// 1. COMPETITOR MANAGEMENT ENDPOINTS
// ==========================================

// Get all competitors
app.get('/api/competitors', (req, res) => {
  const competitors = readJson(COMPETITORS_FILE, []);
  res.json({
    success: true,
    count: competitors.length,
    competitors: competitors
  });
});

// Add new competitor dynamically (supports automatic live fetch or real custom details)
app.post('/api/competitors', async (req, res) => {
  const { username, name, followers, bio, avatar, niche, avgViews } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
  const competitors = readJson(COMPETITORS_FILE, []);

  // Check if already exists
  if (competitors.some(c => c.username.toLowerCase() === cleanUsername)) {
    return res.status(409).json({ success: false, message: `@${cleanUsername} is already in your competitor list.` });
  }

  try {
    const customDetails = (name || followers || bio || avgViews) ? {
      name,
      followers: followers ? Number(String(followers).replace(/,/g, '')) : undefined,
      bio,
      avatar,
      niche,
      avgViews: avgViews ? Number(String(avgViews).replace(/,/g, '')) : undefined
    } : null;

    // Scrape or apply verified competitor data
    const scraped = await scrapeCompetitorData(cleanUsername, true, customDetails);
    const newCompetitor = scraped.creator;

    competitors.push(newCompetitor);
    writeJson(COMPETITORS_FILE, competitors);

    // Save reels to cache
    reelsCache.set(cleanUsername, scraped.reels);

    // Also update Discovery list if present
    const discoveryList = readJson(TECH_AI_FILE, []);
    const discIdx = discoveryList.findIndex(d => d.username.toLowerCase() === cleanUsername);
    if (discIdx !== -1) {
      discoveryList[discIdx].isAdded = true;
      writeJson(TECH_AI_FILE, discoveryList);
    }

    res.status(201).json({
      success: true,
      message: `Successfully added @${cleanUsername} to competitors.`,
      competitor: newCompetitor,
      reelsCount: scraped.reels.length
    });
  } catch (err) {
    console.error('Failed to add competitor:', err);
    res.status(500).json({ success: false, message: `Could not fetch competitor data: ${err.message}` });
  }
});

// Update existing competitor's real profile details & stats
app.put('/api/competitors/:username', (req, res) => {
  const username = req.params.username.replace(/^@/, '').trim().toLowerCase();
  const { name, followers, bio, avatar, niche, avgViews } = req.body;

  let competitors = readJson(COMPETITORS_FILE, []);
  const idx = competitors.findIndex(c => c.username.toLowerCase() === username);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: `@${username} not found.` });
  }

  const comp = competitors[idx];
  if (name !== undefined) comp.name = name;
  if (followers !== undefined) comp.followers = Number(String(followers).replace(/,/g, ''));
  if (bio !== undefined) comp.bio = bio;
  if (avatar !== undefined) comp.avatar = avatar;
  if (niche !== undefined) comp.niche = niche;
  if (avgViews !== undefined) comp.avgViews = Number(String(avgViews).replace(/,/g, ''));

  if (comp.followers > 0 && comp.avgViews > 0) {
    comp.avgEngagementRate = parseFloat(((comp.avgViews * 0.05 / comp.followers) * 100).toFixed(2));
  }

  comp.dataSource = "Verified Real Stats (User Updated)";
  comp.lastScraped = new Date().toISOString();

  competitors[idx] = comp;
  writeJson(COMPETITORS_FILE, competitors);

  // Update reels cache creator metadata
  const existingReels = reelsCache.get(username) || [];
  const updatedReels = existingReels.map(r => ({
    ...r,
    creator: {
      ...r.creator,
      name: comp.name,
      followers: comp.followers,
      avatar: comp.avatar,
      avgViews: comp.avgViews
    }
  }));
  reelsCache.set(username, updatedReels);

  res.json({
    success: true,
    message: `Updated @${username}'s profile details.`,
    competitor: comp
  });
});

// Add a real reel to a competitor
app.post('/api/competitors/:username/reels', (req, res) => {
  const username = req.params.username.replace(/^@/, '').trim().toLowerCase();
  const { permalink, caption, views, likes, comments, topic, thumbnail } = req.body;

  let competitors = readJson(COMPETITORS_FILE, []);
  const comp = competitors.find(c => c.username.toLowerCase() === username);
  if (!comp) {
    return res.status(404).json({ success: false, message: `@${username} not found.` });
  }

  const existingReels = reelsCache.get(username) || [];
  const realViews = Number(String(views || 0).replace(/,/g, ''));
  const realLikes = Number(String(likes || 0).replace(/,/g, ''));
  const realComments = Number(String(comments || 0).replace(/,/g, ''));
  const now = Date.now();

  const newReel = {
    id: `custom_${username}_${Date.now()}`,
    shortcode: permalink ? (permalink.match(/reel\/([^\/\?]+)/)?.[1] || `reel_${Date.now()}`) : `reel_${Date.now()}`,
    permalink: permalink || `https://www.instagram.com/${username}/`,
    thumbnail: thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
    caption: caption || "",
    likes: realLikes,
    comments: realComments,
    views: realViews,
    timestamp: now - 3600000,
    ageHours: 1.0,
    duration: 35,
    isVideo: true,
    topic: topic || "Live Reel",
    hookType: "Creator Original",
    breakoutBlueprint: "Verified custom reel entry.",
    sound: "Original Audio",
    audioTrending: false,
    velocity: realViews,
    creator: {
      username: comp.username,
      name: comp.name,
      avatar: comp.avatar,
      followers: comp.followers,
      avgViews: comp.avgViews
    }
  };

  existingReels.unshift(newReel);
  reelsCache.set(username, existingReels);

  res.status(201).json({
    success: true,
    message: `Added reel for @${username}.`,
    reel: newReel
  });
});

// Remove competitor
app.delete('/api/competitors/:username', (req, res) => {
  const username = req.params.username.replace(/^@/, '').trim().toLowerCase();
  let competitors = readJson(COMPETITORS_FILE, []);

  const initialLength = competitors.length;
  competitors = competitors.filter(c => c.username.toLowerCase() !== username);

  if (competitors.length === initialLength) {
    return res.status(404).json({ success: false, message: `@${username} not found in competitor list.` });
  }

  writeJson(COMPETITORS_FILE, competitors);
  reelsCache.delete(username);

  // Update Discovery list isAdded state
  const discoveryList = readJson(TECH_AI_FILE, []);
  const discIdx = discoveryList.findIndex(d => d.username.toLowerCase() === username);
  if (discIdx !== -1) {
    discoveryList[discIdx].isAdded = false;
    writeJson(TECH_AI_FILE, discoveryList);
  }

  res.json({
    success: true,
    message: `Removed @${username} from competitors.`
  });
});

// Refresh competitor data
app.post('/api/competitors/refresh', async (req, res) => {
  try {
    await syncAllCompetitorsReels(true);
    return res.json({ success: true, message: 'Refreshed all competitors.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/competitors/refresh/:username', async (req, res) => {
  const username = req.params.username.replace(/^@/, '').trim().toLowerCase();
  try {
    const scraped = await scrapeCompetitorData(username, true);
    reelsCache.set(username, scraped.reels);
    
    const competitors = readJson(COMPETITORS_FILE, []);
    const idx = competitors.findIndex(c => c.username.toLowerCase() === username);
    if (idx !== -1) {
      competitors[idx] = { ...competitors[idx], ...scraped.creator, lastScraped: new Date().toISOString() };
      writeJson(COMPETITORS_FILE, competitors);
    }
    return res.json({ success: true, message: `Refreshed @${username}.`, competitor: competitors[idx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Daily Follower Sync endpoint (manual or cron-triggered)
app.post('/api/competitors/daily-sync', async (req, res) => {
  try {
    const result = await runDailyFollowerSync();
    const competitors = readJson(COMPETITORS_FILE, []);
    res.json({
      success: true,
      message: `Daily sync finished: updated ${result.count} of ${result.total} creators.`,
      competitors,
      syncedAt: result.syncedAt
    });
  } catch (err) {
    res.status(500).json({ success: false, message: `Daily sync failed: ${err.message}` });
  }
});

// ==========================================
// 2. ADVANCED REELS FILTERING & SORTING
// ==========================================

// Get all reels with timeframe filter and sorting
app.get('/api/reels', async (req, res) => {
  const {
    timeframe = 'all', // '24h', '2d', '4d', '1w', 'all'
    sort = 'views',     // 'views', 'engagement', 'velocity', 'viralScore', 'likes', 'recent'
    creator,
    search
  } = req.query;

  // Ensure reels are loaded
  if (reelsCache.size === 0) {
    await syncAllCompetitorsReels();
  }

  let allReels = [];
  for (const [uname, reels] of reelsCache.entries()) {
    if (!creator || creator.toLowerCase() === uname.toLowerCase()) {
      allReels.push(...reels);
    }
  }

  // Filter by search query (caption, topic, tags)
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    allReels = allReels.filter(r => 
      (r.caption && r.caption.toLowerCase().includes(q)) ||
      (r.topic && r.topic.toLowerCase().includes(q)) ||
      (r.creator?.username && r.creator.username.toLowerCase().includes(q))
    );
  }

  // Filter by timeframe: 24h, 2d, 4d, 1w
  const timeframeFiltered = filterReelsByTimeframe(allReels, timeframe);

  // Enrich with computed metrics (engagement, velocity, outlier multiplier, boom status)
  const enriched = timeframeFiltered.map(enrichReelMetrics);

  // Sort by requested order (views, engagement, velocity, etc.)
  const sorted = sortReels(enriched, sort);

  res.json({
    success: true,
    timeframe,
    sort,
    count: sorted.length,
    reels: sorted
  });
});

// ==========================================
// 3. VIRAL ALERT / QUICK BOOM DETECTOR
// ==========================================

// Dedicated Fast-Boom view/tab
app.get('/api/fast-boom', async (req, res) => {
  if (reelsCache.size === 0) {
    await syncAllCompetitorsReels();
  }

  let allReels = [];
  for (const [, reels] of reelsCache.entries()) {
    allReels.push(...reels);
  }

  const fastBoomReels = extractFastBoomReels(allReels);

  // Summary statistics
  const supernovaCount = fastBoomReels.filter(r => r.boomLevel === 'SUPERNOVA').length;
  const fastBoomCount = fastBoomReels.filter(r => r.boomLevel === 'FAST_BOOM').length;
  const earlySignalCount = fastBoomReels.filter(r => r.isEarlySignal).length;

  res.json({
    success: true,
    count: fastBoomReels.length,
    stats: {
      supernova: supernovaCount,
      fastBoom: fastBoomCount,
      earlySignals: earlySignalCount
    },
    reels: fastBoomReels
  });
});

// ==========================================
// 4. FAST-GROWING CREATOR DISCOVERY (Tech & AI)
// ==========================================

// Get emerging/fast-growing creators in Tech & AI
app.get('/api/discovery', (req, res) => {
  const { subNiche, sortBy = 'growth' } = req.query;
  let creators = readJson(TECH_AI_FILE, []);
  const competitors = readJson(COMPETITORS_FILE, []);
  const competitorUsernames = new Set(competitors.map(c => c.username.toLowerCase()));

  // Sync isAdded state with current competitors list
  creators = creators.map(c => ({
    ...c,
    isAdded: competitorUsernames.has(c.username.toLowerCase())
  }));

  if (subNiche && subNiche !== 'all') {
    creators = creators.filter(c => c.subNiche.toLowerCase().includes(subNiche.toLowerCase()));
  }

  if (sortBy === 'growth') {
    creators.sort((a, b) => b.growthRate7d - a.growthRate7d);
  } else if (sortBy === 'views') {
    creators.sort((a, b) => b.avgViews - a.avgViews);
  } else if (sortBy === 'followers') {
    creators.sort((a, b) => b.followers - a.followers);
  }

  res.json({
    success: true,
    count: creators.length,
    creators: creators
  });
});

// 1-Click Add discovered creator to Competitor watchlist
app.post('/api/discovery/add-to-competitors', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }

  const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
  const discoveryList = readJson(TECH_AI_FILE, []);
  const item = discoveryList.find(d => d.username.toLowerCase() === cleanUsername);

  const competitors = readJson(COMPETITORS_FILE, []);
  if (competitors.some(c => c.username.toLowerCase() === cleanUsername)) {
    return res.status(409).json({ success: false, message: `@${cleanUsername} is already tracked.` });
  }

  // Scrape / prepare competitor
  const scraped = await scrapeCompetitorData(cleanUsername, true);
  const newComp = scraped.creator;
  if (item) {
    newComp.subNiche = item.subNiche;
  }

  competitors.push(newComp);
  writeJson(COMPETITORS_FILE, competitors);

  reelsCache.set(cleanUsername, scraped.reels);

  // Update discovery item state
  if (item) {
    item.isAdded = true;
    writeJson(TECH_AI_FILE, discoveryList);
  }

  res.json({
    success: true,
    message: `Added @${cleanUsername} to competitors list!`,
    competitor: newComp
  });
});

// ==========================================
// 5. REPLICATION VAULT / SAVED IDEAS
// ==========================================

app.get('/api/saved-ideas', (req, res) => {
  const ideas = readJson(SAVED_IDEAS_FILE, []);
  res.json({ success: true, count: ideas.length, ideas: ideas });
});

app.post('/api/saved-ideas', (req, res) => {
  const { reel, notes, replicationPrompt } = req.body;
  if (!reel || !reel.id) {
    return res.status(400).json({ success: false, message: 'Reel object is required' });
  }

  const ideas = readJson(SAVED_IDEAS_FILE, []);
  const existingIdx = ideas.findIndex(i => i.reelId === reel.id);

  const savedItem = {
    id: `saved_${Date.now()}`,
    reelId: reel.id,
    savedAt: new Date().toISOString(),
    notes: notes || '',
    replicationPrompt: replicationPrompt || reel.breakoutBlueprint || '',
    reel: reel
  };

  if (existingIdx !== -1) {
    ideas[existingIdx] = savedItem;
  } else {
    ideas.unshift(savedItem);
  }

  writeJson(SAVED_IDEAS_FILE, ideas);
  res.json({ success: true, message: 'Reel saved to Replication Vault!', idea: savedItem });
});

app.delete('/api/saved-ideas/:id', (req, res) => {
  let ideas = readJson(SAVED_IDEAS_FILE, []);
  ideas = ideas.filter(i => i.id !== req.params.id && i.reelId !== req.params.id);
  writeJson(SAVED_IDEAS_FILE, ideas);
  res.json({ success: true, message: 'Idea removed from vault.' });
});

// ==========================================
// 6. SCRAPER STATUS & CONFIG (100% Free-Tier)
// ==========================================

app.get('/api/scraper/status', (req, res) => {
  res.json({
    success: true,
    engine: 'Instagram Multi-Engine Sync',
    is100PercentFree: true,
    cost: '$0.00 / Lifetime Free',
    mode: scraperConfig.mode,
    publicEndpointsActive: true,
    cachedCompetitorsCount: reelsCache.size,
    lastSync: lastCacheUpdate ? new Date(lastCacheUpdate).toISOString() : 'Pending',
    hasInstagramSessionId: Boolean(scraperConfig.instagramSessionId),
    hasApifyToken: Boolean(scraperConfig.apifyToken),
    hasRapidApiKey: Boolean(scraperConfig.rapidApiKey)
  });
});

app.post('/api/scraper/config', (req, res) => {
  const { mode, instagramSessionId, apifyToken, rapidApiKey } = req.body;
  if (mode) scraperConfig.mode = mode;
  if (instagramSessionId !== undefined) scraperConfig.instagramSessionId = instagramSessionId;
  if (apifyToken !== undefined) scraperConfig.apifyToken = apifyToken;
  if (rapidApiKey !== undefined) scraperConfig.rapidApiKey = rapidApiKey;

  res.json({
    success: true,
    message: 'Scraper settings updated successfully.',
    config: {
      mode: scraperConfig.mode,
      hasInstagramSessionId: Boolean(scraperConfig.instagramSessionId),
      hasApifyToken: Boolean(scraperConfig.apifyToken),
      hasRapidApiKey: Boolean(scraperConfig.rapidApiKey)
    }
  });
});

// CSV Export Endpoint
app.get('/api/export/csv', (req, res) => {
  let allReels = [];
  for (const [, reels] of reelsCache.entries()) {
    allReels.push(...reels);
  }
  const enriched = allReels.map(enrichReelMetrics);

  let csv = 'Creator,Shortcode,Permalink,AgeHours,Views,Likes,Comments,EngagementRate,VelocityViewsPerHour,OutlierMultiplier,BoomBadge,Topic\n';
  enriched.forEach(r => {
    const topicClean = (r.topic || '').replace(/"/g, '""');
    csv += `"${r.creator?.username}","${r.shortcode}","${r.permalink}",${r.ageHours},${r.views},${r.likes},${r.comments},${r.engagementRate}%,${r.velocity},${r.outlierMultiplier}x,"${r.boomBadge}","${topicClean}"\n`;
  });

  res.header('Content-Type', 'text/csv');
  res.attachment(`instagram_competitor_analysis_${Date.now()}.csv`);
  res.send(csv);
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Instagram Competitor Analysis Engine running at http://localhost:${PORT}`);
});
