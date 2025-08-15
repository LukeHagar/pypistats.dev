import { readFileSync } from 'fs';
import { join } from 'path';

export const GET = async () => {
	try {
		// Read the OpenAPI YAML file from the project root
		const openApiPath = join(process.cwd(), 'openapi.yaml');
		const yamlContent = readFileSync(openApiPath, 'utf-8');
		
		// Return the YAML content with proper headers
		return new Response(yamlContent, {
			headers: {
				'Content-Type': 'application/x-yaml',
				'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
			},
		});
	} catch (error) {
		console.error('Error reading OpenAPI YAML file:', error);
		return new Response('OpenAPI specification not found', { status: 404 });
	}
};
