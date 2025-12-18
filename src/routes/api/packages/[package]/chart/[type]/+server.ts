import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { CacheManager } from '$lib/redis.js';
import { getOverallDownloads, getPythonMajorDownloads, getPythonMinorDownloads, getSystemDownloads, getInstallerDownloads, getVersionDownloads } from '$lib/api.js';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { trackApiEvent } from '$lib/analytics.js';
import { rateLimit } from '$lib/rate-limit.js';
import { validatePackageName } from '$lib/package-name.js';

const cache = new CacheManager();

const width = 1200;
const height = 600;

function mergeHeaders(...parts: Array<Record<string, string> | undefined>): HeadersInit {
  const out: Record<string, string> = {};
  for (const p of parts) {
    if (!p) continue;
    for (const [k, v] of Object.entries(p)) out[k] = v;
  }
  return out;
}

export const GET: RequestHandler = async (event) => {
  const { params, url, request } = event;
  const parsed = validatePackageName(params.package || '');
  if (!parsed.ok) {
    return new Response('Invalid package', { status: 400 });
  }
  const packageName = parsed.name;
  const type = params.type || 'overall';
  const chartType = (url.searchParams.get('chart') || 'line').toLowerCase(); // 'line' | 'bar'
  const mirrors = url.searchParams.get('mirrors') || undefined; // for overall
  const version = url.searchParams.get('version') || undefined; // for python_* filters
  const os = url.searchParams.get('os') || undefined; // for system filter
  const format = (url.searchParams.get('format') || '').toLowerCase(); // 'json' to return data only

  // packageName validated above

  // Protect chart rendering (CPU heavy). Slightly higher quota if returning JSON only.
  const isJsonOnly = format === 'json';
  const rl = await rateLimit(event, `api:chart:${type}`, isJsonOnly ? 120 : 60, 60);
  if (rl.limited) {
    return new Response('Rate limit exceeded', { status: 429, headers: rl.headers });
  }

  const cacheKey = `pypistats:chart:${packageName}:${type}:${chartType}:${mirrors || ''}:${version || ''}:${os || ''}`;
  const skipCache = dev || url.searchParams.get('nocache') === '1' || url.searchParams.get('cache') === 'false';
  if (!skipCache) {
    const cached = await cache.get<string>(cacheKey);
    if (cached) {
      const buffer = Buffer.from(cached, 'base64');
      return new Response(buffer, {
        headers: mergeHeaders(rl.headers, {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600'
        })
      });
    }
  }

  try {
    // Fetch data based on type
    let rows: Array<{ date: any; category: string; downloads: number | bigint }>; 
    if (type === 'overall') {
      rows = await getOverallDownloads(packageName, mirrors);
    } else if (type === 'python_major') {
      rows = await getPythonMajorDownloads(packageName, version);
    } else if (type === 'python_minor') {
      rows = await getPythonMinorDownloads(packageName, version);
    } else if (type === 'system') {
      rows = await getSystemDownloads(packageName, os);
    } else if (type === 'installer') {
      rows = await getInstallerDownloads(packageName);
    } else if (type === 'version') {
      rows = await getVersionDownloads(packageName);
    } else {
      return new Response('Unknown chart type', { status: 400 });
    }

    // Group by category -> timeseries
    const seriesMap = new Map<string, Array<{ x: string; y: number }>>();
    for (const r of rows) {
      const key = r.category;
      if (!seriesMap.has(key)) seriesMap.set(key, []);
      const isoDate = typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0];
      seriesMap.get(key)!.push({ x: isoDate, y: Number(r.downloads) });
    }
    for (const arr of seriesMap.values()) {
      arr.sort((a, b) => a.x.localeCompare(b.x));
    }

    // Build normalized date labels so datasets align with labels
    const labels = Array.from(
      new Set(
        rows.map(r => (typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0]))
      )
    ).sort();

    const datasets = Array.from(seriesMap.entries()).map(([label, points], idx) => {
      const color = palette[idx % palette.length];
      return {
        label,
        data: labels.map(l => points.find(p => p.x === l)?.y ?? 0),
        borderColor: color,
        backgroundColor: color + '33',
        fill: chartType === 'line'
      } as any;
    });

    // Human-friendly chart title
    const typeTitle =
      type === 'overall' ? 'Overall downloads (with/without mirrors)'
      : type === 'python_major' ? 'Downloads by Python major version'
      : type === 'python_minor' ? 'Downloads by Python minor version'
      : type === 'system' ? 'Downloads by operating system'
      : type === 'installer' ? 'Downloads by installer'
      : type === 'version' ? 'Downloads by version'
      : `${type} downloads`;
    const titleText = `${packageName} — ${typeTitle}`;

    // If JSON/data requested, return data for interactive charts
    if (format === 'json' || format === 'data') {
      const body = {
        package: packageName,
        type,
        chartType,
        title: titleText,
        labels,
        datasets
      };
      trackApiEvent('api_chart', `/api/packages/${encodeURIComponent(packageName)}/chart/${type}`, {
        package: packageName,
        type,
        chart: chartType,
        format: 'json',
        ok: true
      }, request.headers);
      return new Response(JSON.stringify(body), {
        headers: mergeHeaders(rl.headers, {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300'
        })
      });
    }

    const configuration = {
      type: chartType as any,
      data: { labels, datasets },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: titleText }
        },
        scales: {
          x: {
            title: { display: true, text: 'Date' },
            ticks: { autoSkip: true, maxTicksLimit: 12 }
          },
          y: {
            title: { display: true, text: 'Downloads' },
            beginAtZero: true,
            ticks: {
              callback: (value: any) => {
                try { return Number(value).toLocaleString(); } catch { return value; }
              }
            }
          }
        }
      }
    };

    const renderer = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
    const image = await renderer.renderToBuffer(configuration as any, 'image/png');

    // Cache for 1 hour (disabled in dev or when nocache is set)
    if (!skipCache) {
      await cache.set(cacheKey, image.toString('base64'), 3600);
    }

    trackApiEvent('api_chart', `/api/packages/${encodeURIComponent(packageName)}/chart/${type}`, {
      package: packageName,
      type,
      chart: chartType,
      format: 'png',
      ok: true
    }, request.headers);
    return new Response(image, {
      headers: mergeHeaders(rl.headers, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600'
      })
    });
  } catch (error) {
    console.error('Error rendering chart:', error);
    trackApiEvent('api_chart', `/api/packages/${encodeURIComponent(packageName)}/chart/${type}`, {
      package: packageName,
      type,
      chart: chartType,
      ok: false
    }, request.headers);
    return new Response('Internal server error', { status: 500 });
  }
};

const palette = [
  '#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#ea580c', '#0891b2', '#ca8a04', '#4b5563'
];


