# Hosting on Fly.io

This app is configured to deploy on [Fly.io](https://fly.io).

## Pricing Overview

Fly.io requires a credit card on file but offers a generous free tier.

### Free Tier Includes
- **3 shared-cpu-1x VMs** with 256MB RAM each
- **160GB outbound data transfer** per month
- **3GB persistent storage**

Source: https://fly.io/docs/about/pricing/#free-allowances

### What This App Uses
- 1 small VM (shared-cpu-1x, 256MB RAM)
- Minimal bandwidth (Slack sends small JSON payloads)
- No persistent storage (sessions stored in memory)

### Will You Be Charged?

For a small team Slack app with normal usage, **you will stay within the free tier**. The app:

1. Receives HTTP requests from Slack when users interact with it
2. Processes requests (vote buttons, modals, etc.)
3. Sends responses back to Slack

Each interaction is a few kilobytes. You'd need thousands of concurrent users to exceed free limits.

### fly.toml Configuration

```toml
[[vm]]
  memory = "256mb"          # Smallest option
  cpu_kind = "shared"       # Free tier eligible
  cpus = 1

[http_service]
  min_machines_running = 1  # Keep one VM running (covered by free tier)
  auto_stop_machines = false
```

## How It Works

1. **Slack user runs `/planning`** → Slack sends HTTP POST to your Fly.io app
2. **App processes request** → Opens modal, handles votes, etc.
3. **App responds to Slack** → Slack displays the result to users

All communication is Slack ↔ Your App. Users never connect directly to Fly.io.

## Monitoring Usage

Check your usage at: https://fly.io/dashboard → Select your app → Monitoring

## Documentation Links

- Fly.io Pricing: https://fly.io/docs/about/pricing/
- Free Allowances: https://fly.io/docs/about/pricing/#free-allowances
- Fly.io Billing FAQ: https://fly.io/docs/about/billing/
