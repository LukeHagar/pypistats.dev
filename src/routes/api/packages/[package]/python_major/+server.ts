import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPythonMajorDownloads } from '$lib/api.js';
import { trackApiEvent } from '$lib/analytics.js';

export const GET: RequestHandler = async ({ params, url, request }) => {
    const packageName = params.package?.replace(/\./g, '-').replace(/_/g, '-') || '';
    const version = url.searchParams.get('version');
    
    if (packageName === '__all__') {
        return json({ error: 'Invalid package name' }, { status: 400 });
    }
    
    try {
        const downloads = await getPythonMajorDownloads(packageName, version || undefined);
        
        if (downloads.length === 0) {
            return json({ error: 'Package not found' }, { status: 404 });
        }
        
        const response = {
            package: packageName,
            type: 'python_major_downloads',
            data: downloads.map(r => ({
                date: r.date,
                category: r.category,
                downloads: r.downloads
            }))
        };
        trackApiEvent('api_python_major', `/api/packages/${encodeURIComponent(packageName)}/python_major`, {
            package: packageName,
            version: String(version ?? ''),
            ok: true
        }, request.headers);
        return json(response);
    } catch (error) {
        console.error('Error fetching Python major downloads:', error);
        trackApiEvent('api_python_major', `/api/packages/${encodeURIComponent(packageName)}/python_major`, {
            package: packageName,
            version: String(version ?? ''),
            ok: false
        }, request.headers);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}; 