import { getPackageCount, getPopularPackages } from '$lib/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
    // Count distinct packages that have any saved data in DB (recent/month as proxy)
    const [packageCount, popular] = await Promise.all([
      getPackageCount(),
      getPopularPackages(10, 30)
    ]);
		return {
			packageCount,
			popular
		};
	} catch (error) {
		console.error('Error loading page data:', error);
		return {
			packageCount: 0,
			popular: []
		};
	}
}; 

