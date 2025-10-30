# Ollama Chat - Cloudflare Pages

A mobile-first chat interface for Ollama, deployed on Cloudflare Pages with built-in support for Cloudflare Access authentication.

## Features

- Mobile-first responsive design
- Real-time streaming chat responses
- Model selection
- Dark theme optimized for readability
- Cloudflare Access authentication support
- Zero-latency global edge deployment

## Architecture

- **Frontend**: Pure HTML/CSS/JavaScript (no build step required)
- **Backend**: Cloudflare Pages Functions (serverless)
- **Ollama Instance**: `https://soul.hypnodroid.com` (behind Cloudflare Access)

## Project Structure

```
.
├── public/
│   ├── index.html      # Main chat interface
│   └── app.js          # Frontend JavaScript
├── functions/
│   └── api/
│       ├── models.js   # Fetches available Ollama models
│       └── chat.js     # Proxies chat requests with streaming
├── wrangler.jsonc      # Cloudflare configuration
└── package.json        # Dependencies and scripts
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

This will start a local development server at `http://localhost:8788`

**Note**: Local development may not work perfectly with Cloudflare Access. You'll need to be authenticated with your Cloudflare Access instance or temporarily bypass Access for local testing.

### 3. Deploy to Cloudflare Pages

#### Option A: Using Wrangler CLI

```bash
npm run deploy
```

#### Option B: Using Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages**
3. Click **Create a project** > **Connect to Git**
4. Select your repository
5. Configure build settings:
   - **Build command**: (leave empty)
   - **Build output directory**: `public`
6. Click **Save and Deploy**

## Cloudflare Access Integration

The application automatically forwards authentication headers to your Ollama instance:

- `CF-Access-JWT-Assertion` header
- Session cookies

This means users must authenticate through Cloudflare Access to use the application, and their credentials are passed through to the Ollama backend.

## Configuration

### Changing the Ollama Endpoint

Edit both API functions in `functions/api/`:

- `functions/api/models.js` - Update the `ollamaUrl` variable
- `functions/api/chat.js` - Update the `ollamaUrl` variable

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

## Troubleshooting

### Authentication Issues

If you get authentication errors:

1. Ensure you're logged into Cloudflare Access
2. Check that the Cloudflare Access policy includes your Cloudflare Pages domain
3. Verify the Ollama instance is accessible from Cloudflare Workers

### Models Not Loading

1. Check browser console for errors
2. Verify `https://soul.hypnodroid.com/api/tags` is accessible
3. Ensure Cloudflare Access is configured correctly

### Streaming Not Working

1. Verify the Ollama instance supports streaming (`/api/chat` endpoint)
2. Check network tab for connection issues
3. Ensure no proxy or middleware is buffering responses

## License

MIT
