import { searchPackages } from '$lib/api.js';

export const load = async ({ url }) => {
	const searchTerm = url.searchParams.get('q');
	
	if (!searchTerm) {
		return {
			packages: [],
			searchTerm: null
		};
	}
	
	try {
		const packages = await searchPackages(searchTerm);
		return {
			packages,
			searchTerm
		};
	} catch (error) {
		console.error('Error searching packages:', error);
		return {
			packages: [],
			searchTerm
		};
	}
}; 
 

