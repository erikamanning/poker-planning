# Poker Planning Slack App

A Slack app for team poker planning sessions with Jira integration. Vote on tickets using Uncertainty, Complexity, and Effort dimensions to calculate story points.

## Features

- `/planning` command opens modal to upload or paste Jira CSV
- Sequential ticket voting with hidden points
- Three voting dimensions: Uncertainty, Complexity, Effort (Small/Medium/Large)
- Points calculated from a 27-combination lookup table (1-13 scale)
- Facilitator controls for revealing results and advancing tickets
- Session summary with total story points

## Quick Start

### Local Development

1. Copy `.env.example` to `.env` and fill in your Slack credentials
2. Install dependencies:
   ```
   npm install
   ```
3. Run the app:
   ```
   npm run dev
   ```

For local development with HTTP mode, use [ngrok](https://ngrok.com):
```
ngrok http 3000
```
Then update your Slack app's Request URLs to the ngrok URL.

### Production Deployment

See [docs/HOSTING.md](docs/HOSTING.md) for Fly.io deployment details.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SLACK_BOT_TOKEN` | Yes | Bot token (starts with `xoxb-`) |
| `SLACK_SIGNING_SECRET` | Yes | Signing secret from app credentials |
| `SLACK_APP_TOKEN` | Socket Mode only | App-level token (starts with `xapp-`) |
| `HTTP_MODE` | No | Set to `true` for HTTP mode (production) |
| `PORT` | No | Port for HTTP mode (default: 3000) |

## Slack App Configuration

1. Create app at https://api.slack.com/apps
2. **OAuth & Permissions** - Add scopes:
   - `chat:write`
   - `commands`
   - `files:read` (for CSV upload)
3. **Slash Commands** - Create `/planning`
   - Request URL: `https://your-app.fly.dev/slack/events`
4. **Interactivity & Shortcuts** - Enable and set:
   - Request URL: `https://your-app.fly.dev/slack/events`
5. Install app to workspace

## Emergency: Stop the App

If you need to shut down the Fly.io app immediately:

```bash
# Stop all machines (can restart later)
fly scale count 0

# Start again
fly scale count 1

# Completely destroy the app
fly apps destroy poker-planning-wispy-mountain-6009
```

Or use the dashboard: https://fly.io/dashboard - Select app - Settings - Delete

## Fly.io Commands Reference

```bash
# Check app status
fly status

# View logs
fly logs

# SSH into the machine
fly ssh console

# Update secrets
fly secrets set SLACK_BOT_TOKEN=xoxb-new-token

# List secrets
fly secrets list

# Deploy new version
fly deploy

# Scale machines
fly scale count 2  # run 2 instances
fly scale count 0  # stop all instances
```

## Points Lookup Table

Points are calculated based on Uncertainty (U), Complexity (C), and Effort (E):

| U | C | E | Points |
|---|---|---|--------|
| S | S | S | 1 |
| S | S | M | 2 |
| S | M | S | 2 |
| S | S | L | 5 |
| S | M | M | 3 |
| S | L | S | 3 |
| M | S | S | 3 |
| S | M | L | 5 |
| S | L | M | 5 |
| M | S | M | 5 |
| M | M | S | 5 |
| M | M | M | 5 |
| L | S | S | 5 |
| S | L | L | 8 |
| M | S | L | 8 |
| M | L | S | 8 |
| M | M | L | 8 |
| M | L | M | 8 |
| L | S | M | 8 |
| L | M | S | 8 |
| L | M | M | 8 |
| L | L | S | 8 |
| L | S | L | 13 |
| M | L | L | 13 |
| L | M | L | 13 |
| L | L | M | 13 |
| L | L | L | 13 |

## License

MIT
