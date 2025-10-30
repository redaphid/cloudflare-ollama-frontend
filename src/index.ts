/**
 * Ollama Chat - Cloudflare Workers
 *
 * A mobile-first chat interface for Ollama with Cloudflare Access authentication.
 */

const OLLAMA_BASE_URL = 'https://soul.hypnodroid.com';

interface OllamaChatRequest {
	model: string;
	messages: Array<{ role: string; content: string }>;
	stream?: boolean;
}

/**
 * Forward authentication headers from the request to Ollama
 */
function getAuthHeaders(request: Request): HeadersInit {
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
	};

	// Pass through Cloudflare Access JWT token
	const cfAccessJWT = request.headers.get('CF-Access-JWT-Assertion');
	if (cfAccessJWT) {
		headers['CF-Access-JWT-Assertion'] = cfAccessJWT;
	}

	// Pass through cookies for session-based auth
	const cookie = request.headers.get('Cookie');
	if (cookie) {
		headers['Cookie'] = cookie;
	}

	return headers;
}

/**
 * Handle GET /api/models - Fetch available Ollama models
 */
async function handleModelsRequest(request: Request): Promise<Response> {
	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
			method: 'GET',
			headers: getAuthHeaders(request),
		});

		if (!response.ok) {
			return new Response(
				JSON.stringify({
					error: 'Failed to fetch models',
					status: response.status,
					statusText: response.statusText,
				}),
				{
					status: response.status,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
				}
			);
		}

		const data = await response.json();

		return new Response(JSON.stringify(data), {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return new Response(
			JSON.stringify({
				error: errorMessage,
				models: [],
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			}
		);
	}
}

/**
 * Handle POST /api/chat - Stream chat responses from Ollama
 */
async function handleChatRequest(request: Request): Promise<Response> {
	try {
		const body = (await request.json()) as OllamaChatRequest;
		const { model, messages, stream = true } = body;

		if (!model || !messages) {
			return new Response(
				JSON.stringify({
					error: 'Missing required fields: model and messages',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
			method: 'POST',
			headers: getAuthHeaders(request),
			body: JSON.stringify({
				model,
				messages,
				stream: true,
			}),
		});

		if (!ollamaResponse.ok) {
			const errorText = await ollamaResponse.text();
			return new Response(
				JSON.stringify({
					error: 'Ollama API error',
					status: ollamaResponse.status,
					details: errorText,
				}),
				{
					status: ollamaResponse.status,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		// Stream the response back to the client
		return new Response(ollamaResponse.body, {
			headers: {
				'Content-Type': 'application/x-ndjson',
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			},
		});
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return new Response(
			JSON.stringify({
				error: errorMessage,
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
}

/**
 * Main fetch handler
 */
export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		// API routes
		if (url.pathname === '/api/models') {
			return handleModelsRequest(request);
		}

		if (url.pathname === '/api/chat') {
			if (request.method !== 'POST') {
				return new Response('Method not allowed', { status: 405 });
			}
			return handleChatRequest(request);
		}

		// For all other routes, let the assets handler serve static files
		// This will serve index.html, app.js, etc. from the public directory
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
