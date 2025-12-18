import { prisma } from './prisma.js';
import { RECENT_CATEGORIES } from './database.js';
import { CacheManager } from './redis.js';
import { DataProcessor } from './data-processor.js';

const cache = new CacheManager();
let processor: DataProcessor | null = null;
function getProcessor() {
  if (!processor) processor = new DataProcessor();
  return processor;
}

export async function ensurePackageFreshnessFor(packageName: string) {
  try {
    await getProcessor().ensurePackageFreshness(packageName);
  } catch (error) {
    console.error('Failed to ensure package freshness:', packageName, error);
  }
}

export type Results = {
  date: string;
  category: string;
  downloads: number | bigint;
}

export async function getRecentDownloads(packageName: string, category?: string): Promise<Results[]> {
  const cacheKey = CacheManager.getRecentStatsKey(packageName);

  // Ensure DB has fresh data for this package before computing recent
  await ensurePackageFreshnessFor(packageName);

  if (category && RECENT_CATEGORIES.includes(category)) {
    // Compute recent from overall without mirrors
    const bounds = getRecentBounds(category);
    const result = await prisma.overallDownloadCount.groupBy({
      by: ['package'],
      where: {
        package: packageName,
        category: 'without_mirrors',
        date: { gte: bounds.start }
      },
      _sum: { downloads: true }
    });
    return result.map(r => ({
      date: new Date().toISOString().split('T')[0],
      category,
      downloads: r._sum.downloads || 0
    }));
  }

  // Default: return day/week/month computed on the fly
  const day: Results[] = await getRecentDownloads(packageName, 'day');
  const week: Results[] = await getRecentDownloads(packageName, 'week');
  const month: Results[] = await getRecentDownloads(packageName, 'month');
  const result: Results[] = [...day, ...week, ...month];

  // Cache only if non-empty; otherwise clear any stale empty cache
  if (result.length > 0) {
    await cache.set(cacheKey, result, 3600);
  } else {
    await cache.del(cacheKey);
  }

  return result;
}

function getRecentBounds(category: string) {
  const today = new Date();
  let start = new Date(today);
  if (category === 'day') {
    // For day, use yesterday since today's data isn't available yet
    start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  } else if (category === 'week') {
    // For week, use last 8 days (7 + 1 extra day)
    start = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000);
  } else if (category === 'month') {
    // For month, use last 31 days (30 + 1 extra day)
    start = new Date(today.getTime() - 31 * 24 * 60 * 60 * 1000);
  }
  return { start };
}

export async function getOverallDownloads(packageName: string, mirrors?: string) {
  const cacheKey = CacheManager.getPackageKey(packageName, `overall_${mirrors || 'all'}`);

  // Always ensure DB freshness first to avoid returning stale cache
  await ensurePackageFreshnessFor(packageName);

  const whereClause: any = {
    package: packageName
  };

  if (mirrors === 'true') {
    whereClause.category = 'with_mirrors';
  } else if (mirrors === 'false') {
    whereClause.category = 'without_mirrors';
  }

  const result = await prisma.overallDownloadCount.findMany({
    where: whereClause,
    orderBy: {
      date: 'asc'
    }
  });

  // Cache only if non-empty; otherwise clear any stale empty cache
  if (result.length > 0) {
    await cache.set(cacheKey, result, 3600);
  } else {
    await cache.del(cacheKey);
  }

  return result;
}

export async function getPythonMajorDownloads(packageName: string, version?: string) {
  const cacheKey = CacheManager.getPackageKey(packageName, `python_major_${version || 'all'}`);

  // Ensure DB freshness first
  await ensurePackageFreshnessFor(packageName);

  const whereClause: any = {
    package: packageName
  };

  if (version) {
    whereClause.category = version;
  }

  const result = await prisma.pythonMajorDownloadCount.findMany({
    where: whereClause,
    orderBy: {
      date: 'asc'
    }
  });

  if (result.length > 0) {
    await cache.set(cacheKey, result, 3600);
  } else {
    await cache.del(cacheKey);
  }

  return result;
}

export async function getPythonMinorDownloads(packageName: string, version?: string) {
  const cacheKey = CacheManager.getPackageKey(packageName, `python_minor_${version || 'all'}`);

  // Ensure DB freshness first
  await ensurePackageFreshnessFor(packageName);

  const whereClause: any = {
    package: packageName
  };

  if (version) {
    whereClause.category = version;
  }

  const result = await prisma.pythonMinorDownloadCount.findMany({
    where: whereClause,
    orderBy: {
      date: 'asc'
    }
  });

  if (result.length > 0) {
    await cache.set(cacheKey, result, 3600);
  } else {
    await cache.del(cacheKey);
  }

  return result;
}

export async function getSystemDownloads(packageName: string, os?: string) {
  const cacheKey = CacheManager.getPackageKey(packageName, `system_${os || 'all'}`);

  // Ensure DB freshness first
  await ensurePackageFreshnessFor(packageName);

  const whereClause: any = {
    package: packageName
  };

  if (os) {
    whereClause.category = os;
  }

  const result = await prisma.systemDownloadCount.findMany({
    where: whereClause,
    orderBy: {
      date: 'asc'
    }
  });

  if (result.length > 0) {
    await cache.set(cacheKey, result, 3600);
  } else {
    await cache.del(cacheKey);
  }

  return result;
}

export async function getInstallerDownloads(packageName: string, installer?: string) {
  const cacheKey = CacheManager.getPackageKey(packageName, `installer_${installer || 'all'}`);
  // Ensure DB freshness first
  await ensurePackageFreshnessFor(packageName);
  const whereClause: any = { package: packageName };
  if (installer) whereClause.category = installer;
  const result = await (prisma as any).installerDownloadCount.findMany({
    where: whereClause,
    orderBy: { date: 'asc' }
  });
  if (result.length > 0) {
    await cache.set(cacheKey, result, 3600);
  } else {
    await cache.del(cacheKey);
  }
  return result as Array<{ date: Date; package: string; category: string; downloads: number }>;
}

export async function getVersionDownloads(packageName: string, version?: string) {
  const cacheKey = CacheManager.getPackageKey(packageName, `version_${version || 'all'}`);
  // Ensure DB freshness first
  await ensurePackageFreshnessFor(packageName);
  const whereClause: any = { package: packageName };
  if (version) whereClause.category = version;
  try {
    const model = (prisma as any).versionDownloadCount;
    if (!model) return [] as Array<{ date: Date; package: string; category: string; downloads: number }>;
    const result = await model.findMany({
      where: whereClause,
      orderBy: { date: 'asc' }
    });
    if (result.length > 0) {
      await cache.set(cacheKey, result, 3600);
    } else {
      await cache.del(cacheKey);
    }
    return result as Array<{ date: Date; package: string; category: string; downloads: number }>;
  } catch (error) {
    console.error('getVersionDownloads failed:', error);
    return [] as Array<{ date: Date; package: string; category: string; downloads: number }>;
  }
}

export async function searchPackages(searchTerm: string) {
  const query = (searchTerm || '').trim();
  if (!query) return [] as string[];

  const cacheKey = CacheManager.getSearchKey(query);

  // Try to get from cache first
  const cached = await cache.get<string[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Use PyPI Simple API (PEP 691 JSON) to fetch the package index, cache it,
  // then do a local prefix filter for suggestions.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const indexKey = CacheManager.getSearchKey('__simple_index__');
  try {
    // Try index from cache first
    let allPackages = await cache.get<string[]>(indexKey);

    if (!allPackages) {
      const indexResponse = await fetch('https://pypi.org/simple/', {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.pypi.simple.v1+json',
          'User-Agent': 'pypistats.app (server-side)'
        },
        signal: controller.signal
      });

      if (!indexResponse.ok) {
        console.error('PyPI Simple index error:', indexResponse.status, indexResponse.statusText);
      } else {
        const indexJson = (await indexResponse.json()) as { projects?: Array<{ name: string; url: string }>; };
        allPackages = (indexJson.projects || []).map((p) => p.name);
        if (allPackages.length > 0) {
          // Cache the full index for 6 hours
          await cache.set(indexKey, allPackages, 6 * 60 * 60);
        }
      }
    }

    const q = query.toLowerCase();
    let matches: string[] = [];
    if (Array.isArray(allPackages) && allPackages.length > 0) {
      matches = allPackages
        .filter((name) => name.toLowerCase().startsWith(q))
        .slice(0, 20);
    }

    // Fallback: if no matches from the index, try exact project existence via JSON API
    if (matches.length === 0) {
      const projectResponse = await fetch(`https://pypi.org/pypi/${encodeURIComponent(query)}/json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'pypistats.app (server-side)'
        },
        signal: controller.signal
      });
      if (projectResponse.ok) {
        matches = [query];
      }
    }

    // Cache per-query matches for 30 minutes
    await cache.set(cacheKey, matches, 1800);
    return matches;
  } catch (error) {
    if ((error as any)?.name === 'AbortError') {
      console.error('PyPI Simple API request timed out');
    } else {
      console.error('PyPI Simple/API request failed:', error);
    }
    return [] as string[];
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPackageCount() {
  try {
    // Count distinct packages from overall downloads table (most reliable)
    const overall = await prisma.overallDownloadCount.groupBy({
      by: ['package'],
      where: {
        category: 'without_mirrors' // Use without_mirrors as canonical source
      }
    });

    return overall.length;
  } catch (error) {
    console.error('Error getting package count:', error);
    return 0;
  }
}

export async function getPopularPackages(limit = 10, days = 30): Promise<Array<{ package: string; downloads: number }>> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // Prefer 'without_mirrors' as the canonical signal
  const grouped = await prisma.overallDownloadCount.groupBy({
    by: ['package'],
    where: {
      category: 'without_mirrors',
      date: { gte: cutoff }
    },
    _sum: { downloads: true },
    orderBy: { _sum: { downloads: 'desc' } },
    take: limit
  });
  return grouped.map((g) => ({ package: g.package, downloads: Number(g._sum.downloads || 0) }));
}

export type PackageMetadata = {
  name: string;
  version: string | null;
  summary: string | null;
  homePage: string | null;
  projectUrls: Record<string, string> | null;
  pypiUrl: string;
  latestReleaseDate: string | null;
};

export async function getPackageMetadata(packageName: string): Promise<PackageMetadata> {
  const url = `https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'pypistats.app (server-side)'
      }
    });
    if (!res.ok) {
      return {
        name: packageName,
        version: null,
        summary: null,
        homePage: null,
        projectUrls: null,
        pypiUrl: `https://pypi.org/project/${packageName}/`,
        latestReleaseDate: null
      };
    }
    const json = await res.json();
    const info = json?.info || {};
    const version = info?.version ?? null;
    // Determine latest upload time for the current version
    let latestReleaseDate: string | null = null;
    try {
      const releases = json?.releases || {};
      const files = Array.isArray(releases?.[version]) ? releases[version] : [];
      const latest = files.reduce((max: string | null, f: any) => {
        const t = f?.upload_time_iso_8601 || f?.upload_time || null;
        if (!t) return max;
        return !max || new Date(t).getTime() > new Date(max).getTime() ? t : max;
      }, null as string | null);
      latestReleaseDate = latest ? new Date(latest).toISOString().split('T')[0] : null;
    } catch { }
    return {
      name: packageName,
      version,
      summary: info?.summary ?? null,
      homePage: info?.home_page ?? null,
      projectUrls: (info?.project_urls as Record<string, string> | undefined) ?? null,
      pypiUrl: `https://pypi.org/project/${packageName}/`,
      latestReleaseDate
    };
  } catch (error) {
    console.error('getPackageMetadata error:', error);
    return {
      name: packageName,
      version: null,
      summary: null,
      homePage: null,
      projectUrls: null,
      pypiUrl: `https://pypi.org/project/${packageName}/`,
      latestReleaseDate: null
    };
  }
}

// Cache invalidation functions
export async function invalidatePackageCache(packageName: string) {
  const patterns = [
    CacheManager.getRecentStatsKey(packageName),
    CacheManager.getPackageKey(packageName, 'overall_all'),
    CacheManager.getPackageKey(packageName, 'overall_true'),
    CacheManager.getPackageKey(packageName, 'overall_false'),
    CacheManager.getPackageKey(packageName, 'python_major_all'),
    CacheManager.getPackageKey(packageName, 'python_minor_all'),
    CacheManager.getPackageKey(packageName, 'system_all'),
  ];

  for (const pattern of patterns) {
    await cache.del(pattern);
  }
}

export async function invalidateSearchCache() {
  // This would need to be implemented with pattern matching
  // For now, we'll just clear the package count cache
  await cache.del(CacheManager.getPackageCountKey());
}