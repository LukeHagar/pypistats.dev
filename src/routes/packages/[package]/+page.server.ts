import {
  getRecentDownloads,
  getOverallDownloads,
  getPythonMajorDownloads,
  getPythonMinorDownloads,
  getSystemDownloads,
  getPackageMetadata,
  getInstallerDownloads,
  getVersionDownloads
} from '$lib/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const packageName = params.package?.replace(/\./g, '-').replace(/_/g, '-') || '';

  if (!packageName || packageName === '__all__') {
    return {
      packageName,
      recentStats: Promise.resolve(null),
      overallStats: Promise.resolve([]),
      pythonMajorStats: Promise.resolve([]),
      pythonMinorStats: Promise.resolve([]),
      systemStats: Promise.resolve([]),
      summaryTotals: Promise.resolve({})
    };
  }

  // Return promises directly for streaming - SvelteKit will handle the streaming
  const recentStatsP = getRecentDownloads(packageName).then((recent) => {
    const fm: Record<string, number> = {};
    for (const stat of recent) fm[`last_${stat.category}`] = Number(stat.downloads);
    return fm;
  });

  const overallStatsP = getOverallDownloads(packageName);
  const pythonMajorStatsP = getPythonMajorDownloads(packageName);
  const pythonMinorStatsP = getPythonMinorDownloads(packageName);
  const systemStatsP = getSystemDownloads(packageName);
  const installerStatsP = getInstallerDownloads(packageName);
  const versionStatsP = getVersionDownloads(packageName);
  const metaP = getPackageMetadata(packageName);

  const summaryTotalsP = Promise.all([
    overallStatsP,
    pythonMajorStatsP,
    pythonMinorStatsP,
    systemStatsP,
    installerStatsP,
    versionStatsP
  ]).then(([overall, pyMaj, pyMin, system, installer, version]) => {
    const sum = <T extends { category: string; downloads: any }>(rows: T[]) => {
      const map: Record<string, number> = {};
      for (const r of rows) map[r.category] = (map[r.category] || 0) + Number(r.downloads);
      return map;
    };
    return {
      overall: sum(overall),
      python_major: sum(pyMaj),
      python_minor: sum(pyMin),
      system: sum(system),
      installer: sum(installer),
      version: sum(version)
    }
  });

  return {
    packageName,
    meta: metaP,
    recentStats: recentStatsP,
    overallStats: overallStatsP,
    pythonMajorStats: pythonMajorStatsP,
    pythonMinorStats: pythonMinorStatsP,
    systemStats: systemStatsP,
    summaryTotals: summaryTotalsP
  };
};


