# Ollama Chat - Cloudflare Workers

A mobile-first chat interface for Ollama, deployed on Cloudflare Workers with built-in support for Cloudflare Access authentication.

## Features

- Mobile-first responsive design
- Real-time streaming chat responses
- Model selection
- Dark theme optimized for readability
- Cloudflare Access authentication support
- TypeScript for type safety
- Modern Cloudflare Workers architecture

## Architecture

- **Frontend**: Pure HTML/CSS/JavaScript (no build step required)
- **Backend**: Cloudflare Workers with TypeScript
- **Ollama Instance**: `https://soul.hypnodroid.com` (behind Cloudflare Access)

## Project Structure

```
.
├── public/
│   ├── index.html      # Main chat interface
│   └── app.js          # Frontend JavaScript
├── src/
│   └── index.ts        # TypeScript Worker with API handlers
├── wrangler.jsonc      # Cloudflare configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies and scripts
├── .prettierrc         # Code formatting
└── .editorconfig       # Editor configuration
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Local Development

```bash
npm run dev
```

This will start a local development server at `http://localhost:8787`

**Note**: Local development may not work perfectly with Cloudflare Access. You'll need to be authenticated with your Cloudflare Access instance or temporarily bypass Access for local testing.

### 3. Deploy to Cloudflare Workers

```bash
npm run deploy
```

## Cloudflare Access Integration

The application automatically forwards authentication headers to your Ollama instance:

- `CF-Access-JWT-Assertion` header
- Session cookies

This means users must authenticate through Cloudflare Access to use the application, and their credentials are passed through to the Ollama backend.

## Configuration

### Changing the Ollama Endpoint

Edit the `OLLAMA_BASE_URL` constant in `src/index.ts`:

```typescript
const OLLAMA_BASE_URL = 'https://soul.hypnodroid.com';
```

### Customizing the UI

The interface is a single HTML file with embedded CSS. Edit `public/index.html` to customize:

- Colors and theme
- Layout and spacing
- Font choices
- Model selector

## API Endpoints

### GET /api/models

Returns list of available Ollama models.

**Response**:
```json
{
  "models": [
    {
      "name": "llama2",
      "modified_at": "2024-01-01T00:00:00Z",
      "size": 3826793728
    }
  ]
}
```

### POST /api/chat

Streams chat responses from Ollama.

**Request**:
```json
{
  "model": "llama2",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "stream": true
}
```

**Response**: NDJSON stream of chat chunks

## Development

### Type Generation

Generate TypeScript types for Cloudflare bindings:

```bash
npm run cf-typegen
```

This creates `worker-configuration.d.ts` with types for your Worker environment.

## Troubleshooting

### Authentication Issues

If you get authentication errors:

1. Ensure you're logged into Cloudflare Access
2. Check that the Cloudflare Access policy includes your Cloudflare Workers domain
3. Verify the Ollama instance is accessible from Cloudflare Workers

### Models Not Loading

1. Check browser console for errors
2. Verify `https://soul.hypnodroid.com/api/tags` is accessible
3. Ensure Cloudflare Access is configured correctly

### Streaming Not Working

1. Verify the Ollama instance supports streaming (`/api/chat` endpoint)
2. Check network tab for connection issues
3. Ensure no proxy or middleware is buffering responses

### TypeScript Errors

1. Run `npm run cf-typegen` to regenerate types
2. Check `tsconfig.json` for configuration issues
3. Ensure `worker-configuration.d.ts` is included in the types array

## License

MIT
