export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const body = await request.json();
        const { model, messages, stream = true } = body;

        if (!model || !messages) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: model and messages'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get Cloudflare Access token from the request
        const cfAccessJWT = request.headers.get('CF-Access-JWT-Assertion');

        const ollamaUrl = 'https://soul.hypnodroid.com/api/chat';

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

        const ollamaResponse = await fetch(ollamaUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model,
                messages,
                stream: true
            })
        });

        if (!ollamaResponse.ok) {
            const errorText = await ollamaResponse.text();
            return new Response(JSON.stringify({
                error: 'Ollama API error',
                status: ollamaResponse.status,
                details: errorText
            }), {
                status: ollamaResponse.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Stream the response back to the client
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        // Pipe the Ollama response through
        (async () => {
            try {
                const reader = ollamaResponse.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    // Forward the chunk
                    await writer.write(value);
                }
            } catch (error) {
                console.error('Stream error:', error);
            } finally {
                writer.close();
            }
        })();

        return new Response(readable, {
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
