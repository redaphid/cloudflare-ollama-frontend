export async function onRequest(context) {
    const { request, env } = context;

    // Get Cloudflare Access token from the request
    const cfAccessJWT = request.headers.get('CF-Access-JWT-Assertion');

    // Ollama API endpoint
    const ollamaUrl = 'https://soul.hypnodroid.com/api/tags';

    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Pass through Cloudflare Access token if present
        if (cfAccessJWT) {
            headers['CF-Access-JWT-Assertion'] = cfAccessJWT;
        }

        // Also check for the cookie-based auth
        const cookie = request.headers.get('Cookie');
        if (cookie) {
            headers['Cookie'] = cookie;
        }

        const response = await fetch(ollamaUrl, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            return new Response(JSON.stringify({
                error: 'Failed to fetch models',
                status: response.status,
                statusText: response.statusText
            }), {
                status: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message,
            models: []
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
