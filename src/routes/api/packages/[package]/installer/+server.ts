import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma.js';
import { DataProcessor } from '$lib/data-processor.js';
import { trackApiEvent } from '$lib/analytics.js';

export const GET: RequestHandler = async ({ params, request }) => {
  const packageName = params.package?.replace(/\./g, '-').replace(/_/g, '-') || '';
  if (!packageName || packageName === '__all__') {
    return json({ error: 'Invalid package name' }, { status: 400 });
  }

  try {
    const processor = new DataProcessor();
    await processor.ensurePackageFreshness(packageName);

    const rows = await prisma.installerDownloadCount.findMany({
      where: { package: packageName },
      orderBy: { date: 'asc' }
    });

    const response = {
      package: packageName,
      type: 'installer_downloads',
      data: rows.map(r => ({ date: r.date, category: r.category, downloads: r.downloads }))
    };
    trackApiEvent('api_installer', `/api/packages/${encodeURIComponent(packageName)}/installer`, {
      package: packageName,
      ok: true
    }, request.headers);
    return json(response);
  } catch (error) {
    console.error('Error fetching installer downloads:', error);
    trackApiEvent('api_installer', `/api/packages/${encodeURIComponent(packageName)}/installer`, {
      package: packageName,
      ok: false
    }, request.headers);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};


