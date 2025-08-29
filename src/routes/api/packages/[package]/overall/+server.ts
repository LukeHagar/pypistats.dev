import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOverallDownloads } from '$lib/api.js';
import { trackApiEvent } from '$lib/analytics.js';

export const GET: RequestHandler = async ({ params, url, request }) => {
    const packageName = params.package?.replace(/\./g, '-').replace(/_/g, '-') || '';
    const mirrors = url.searchParams.get('mirrors');
    
    if (packageName === '__all__') {
        return json({ error: 'Invalid package name' }, { status: 400 });
    }
    
    try {
        const downloads = await getOverallDownloads(packageName, mirrors || undefined);
        
        if (downloads.length === 0) {
            return json({ error: 'Package not found' }, { status: 404 });
        }
        
        const response = {
            package: packageName,
            type: 'overall_downloads',
            data: downloads.map(r => ({
                date: r.date,
                category: r.category,
                downloads: r.downloads
            }))
        };
        
        trackApiEvent('api_overall', `/api/packages/${encodeURIComponent(packageName)}/overall`, {
            package: packageName,
            mirrors: String(mirrors ?? ''),
            ok: true
        }, request.headers);
        return json(response);
    } catch (error) {
        console.error('Error fetching overall downloads:', error);
        trackApiEvent('api_overall', `/api/packages/${encodeURIComponent(packageName)}/overall`, {
            package: packageName,
            mirrors: String(mirrors ?? ''),
            ok: false
        }, request.headers);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}; 