import { getPackageCount, getPopularPackages } from '$lib/api.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Return promises directly for streaming - SvelteKit will handle the streaming
  const packageCountP = getPackageCount();
  const popularP = getPopularPackages(10, 30);

  return {
    packageCount: packageCountP,
    popular: popularP
  };
}; 

