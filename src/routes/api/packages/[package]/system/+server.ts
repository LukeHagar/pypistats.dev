import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSystemDownloads } from '$lib/api.js';
import { trackApiEvent } from '$lib/analytics.js';

export const GET: RequestHandler = async ({ params, url, request }) => {
    const packageName = params.package?.replace(/\./g, '-').replace(/_/g, '-') || '';
    const os = url.searchParams.get('os');
    
    if (packageName === '__all__') {
        return json({ error: 'Invalid package name' }, { status: 400 });
    }
    
    try {
        const downloads = await getSystemDownloads(packageName, os || undefined);
        
        if (downloads.length === 0) {
            return json({ error: 'Package not found' }, { status: 404 });
        }
        
        const response = {
            package: packageName,
            type: 'system_downloads',
            data: downloads.map(r => ({
                date: r.date,
                category: r.category,
                downloads: r.downloads
            }))
        };
        trackApiEvent('api_system', `/api/packages/${encodeURIComponent(packageName)}/system`, {
            package: packageName,
            os: String(os ?? ''),
            ok: true
        }, request.headers);
        return json(response);
    } catch (error) {
        console.error('Error fetching system downloads:', error);
        trackApiEvent('api_system', `/api/packages/${encodeURIComponent(packageName)}/system`, {
            package: packageName,
            os: String(os ?? ''),
            ok: false
        }, request.headers);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}; 