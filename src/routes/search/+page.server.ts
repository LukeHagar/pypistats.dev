import { searchPackages } from '$lib/api.js';

export const load = async ({ url }) => {
	const searchTerm = url.searchParams.get('q');
	
	if (!searchTerm) {
		return {
			packages: Promise.resolve([]),
			searchTerm: null
		};
	}
	
	// Return promise directly for streaming - SvelteKit will handle the streaming
	const packagesP = searchPackages(searchTerm);
	
	return {
		packages: packagesP,
		searchTerm
	};
}; 
 

