import axios from 'axios';
import { Review } from '../models/Review.js';
import { WatchlistItem } from '../models/WatchlistItem.js';

const NEWS_SOURCES = [
  { key: 'variety', name: 'Variety', url: 'https://variety.com/v/film/feed/' },
  { key: 'thr', name: 'The Hollywood Reporter', url: 'https://www.hollywoodreporter.com/c/movies/feed/' },
  { key: 'deadline', name: 'Deadline', url: 'https://deadline.com/v/film/feed/' },
  { key: 'indiewire', name: 'IndieWire', url: 'https://www.indiewire.com/c/film/feed/' },
];

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
let cachedNews = { items: [], fetchedAt: 0 };

const decodeEntities = (str = '') =>
  str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#8217;|&#x2019;/g, '’')
    .replace(/&#8216;|&#x2018;/g, '‘')
    .replace(/&#8220;|&#x201C;/g, '“')
    .replace(/&#8221;|&#x201D;/g, '”')
    .replace(/&#8211;|&#x2013;/g, '–')
    .replace(/&#8212;|&#x2014;/g, '—')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

const stripHtml = (html = '') =>
  decodeEntities(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractTag = (block, tag) => {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = block.match(regex);
  return match ? match[1].trim() : '';
};

const extractImage = (block) => {
  const mediaMatch =
    block.match(/<media:content[^>]+url=["']([^"']+)["']/i) ||
    block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i) ||
    block.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch?.[1]) return mediaMatch[1];

  const imgMatch = decodeEntities(block).match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch?.[1] || '';
};

const parseRssItems = (xml, source) => {
  const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return itemBlocks
    .slice(0, 15)
    .map((block) => {
      const title = stripHtml(extractTag(block, 'title'));
      const link = decodeEntities(extractTag(block, 'link')).trim();
      const pubDateRaw = extractTag(block, 'pubDate');
      const descriptionRaw = extractTag(block, 'description');
      const contentRaw = extractTag(block, 'content:encoded');
      const summary = stripHtml(descriptionRaw || contentRaw).slice(0, 220);
      const imageUrl = extractImage(block);
      const publishedAt = pubDateRaw ? new Date(pubDateRaw) : new Date();

      return {
        id: link || `${source.key}-${title}`,
        title,
        link,
        summary: summary.length >= 218 ? `${summary}...` : summary,
        imageUrl,
        sourceKey: source.key,
        sourceName: source.name,
        publishedAt: Number.isNaN(publishedAt.getTime())
          ? new Date().toISOString()
          : publishedAt.toISOString(),
      };
    })
    .filter((item) => item.title && item.link);
};

const fetchFreshNews = async () => {
  const results = await Promise.allSettled(
    NEWS_SOURCES.map(async (source) => {
      const { data } = await axios.get(source.url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'ReelClub/1.0 (+https://reelclub.app)',
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
      });
      return parseRssItems(String(data), source);
    })
  );

  const merged = [];
  const seenLinks = new Set();

  for (const res of results) {
    if (res.status !== 'fulfilled') continue;
    for (const item of res.value) {
      if (seenLinks.has(item.link)) continue;
      seenLinks.add(item.link);
      merged.push(item);
    }
  }

  merged.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return merged;
};

export const getLatestMovieNews = async ({ source = 'all', limit = 30 } = {}) => {
  const isFresh =
    cachedNews.items.length > 0 && Date.now() - cachedNews.fetchedAt < CACHE_TTL_MS;

  if (!isFresh) {
    try {
      const freshItems = await fetchFreshNews();
      if (freshItems.length > 0) {
        cachedNews = { items: freshItems, fetchedAt: Date.now() };
      }
    } catch (error) {
      console.error('Movie news fetch error:', error.message);
    }
  }

  const filtered =
    source && source !== 'all'
      ? cachedNews.items.filter((item) => item.sourceKey === source)
      : cachedNews.items;

  return {
    results: filtered.slice(0, Math.min(Number(limit) || 30, 50)),
    sources: NEWS_SOURCES.map(({ key, name }) => ({ key, name })),
    updatedAt: cachedNews.fetchedAt ? new Date(cachedNews.fetchedAt).toISOString() : null,
  };
};

export const getForYouNews = async (userId) => {
  const [{ results: allNews, sources, updatedAt }, reviews, watchlist] = await Promise.all([
    getLatestMovieNews({ source: 'all', limit: 50 }),
    Review.find({ user: userId })
      .sort({ watchedAt: -1 })
      .limit(20)
      .populate('movie', 'title genres director creators')
      .lean(),
    WatchlistItem.find({ user: userId })
      .sort({ addedAt: -1 })
      .limit(20)
      .populate('movie', 'title genres director creators')
      .lean(),
  ]);

  const keywordWeights = new Map();
  const addKeyword = (term, weight) => {
    const clean = term?.trim();
    if (!clean || clean.length < 3) return;
    const key = clean.toLowerCase();
    keywordWeights.set(key, {
      label: clean,
      weight: (keywordWeights.get(key)?.weight || 0) + weight,
    });
  };

  for (const entry of [...reviews, ...watchlist]) {
    const m = entry.movie;
    if (!m) continue;
    addKeyword(m.title, 3);
    if (m.director) addKeyword(m.director, 3);
    for (const c of m.creators || []) addKeyword(c, 3);
    for (const g of m.genres || []) addKeyword(g, 1.5);
  }

  const topInterests = [...keywordWeights.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 12)
    .map((k) => k.label);

  const scored = allNews.map((article) => {
    const haystack = `${article.title} ${article.summary}`.toLowerCase();
    let score = 0;
    const matchedReasons = [];

    for (const [key, info] of keywordWeights.entries()) {
      if (haystack.includes(key)) {
        score += info.weight;
        if (matchedReasons.length < 2) matchedReasons.push(info.label);
      }
    }

    return {
      ...article,
      relevanceScore: score,
      matchedReasons,
    };
  });

  // Sort by relevance first, then recency
  scored.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  return {
    results: scored.slice(0, 25),
    interests: topInterests,
    sources,
    updatedAt,
  };
};
