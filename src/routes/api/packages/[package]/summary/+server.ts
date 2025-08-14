import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma.js';
import { DataProcessor } from '$lib/data-processor.js';

export const GET: RequestHandler = async ({ params }) => {
  const packageName = params.package?.replace(/\./g, '-').replace(/_/g, '-') || '';
  if (!packageName || packageName === '__all__') {
    return json({ error: 'Invalid package name' }, { status: 400 });
  }

  try {
    const processor = new DataProcessor();
    await processor.ensurePackageFreshness(packageName);

    const [overallAll, systemAll, pyMajorAll, pyMinorAll] = await Promise.all([
      prisma.overallDownloadCount.groupBy({
        by: ['category'],
        where: { package: packageName },
        _sum: { downloads: true }
      }),
      prisma.systemDownloadCount.groupBy({
        by: ['category'],
        where: { package: packageName },
        _sum: { downloads: true }
      }),
      prisma.pythonMajorDownloadCount.groupBy({
        by: ['category'],
        where: { package: packageName },
        _sum: { downloads: true }
      }),
      prisma.pythonMinorDownloadCount.groupBy({
        by: ['category'],
        where: { package: packageName },
        _sum: { downloads: true }
      })
    ]);

    const overallTotal = overallAll.reduce((sum, r) => sum + Number(r._sum.downloads || 0), 0);
    const systemTotals = Object.fromEntries(systemAll.map(r => [r.category, Number(r._sum.downloads || 0)]));
    const pythonMajorTotals = Object.fromEntries(pyMajorAll.map(r => [r.category, Number(r._sum.downloads || 0)]));
    const pythonMinorTotals = Object.fromEntries(pyMinorAll.map(r => [r.category, Number(r._sum.downloads || 0)]));

    return json({
      package: packageName,
      type: 'summary',
      totals: {
        overall: overallTotal,
        system: systemTotals,
        python_major: pythonMajorTotals,
        python_minor: pythonMinorTotals
      }
    });
  } catch (error) {
    console.error('Error building package summary:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};


