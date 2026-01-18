import { App, ExpressReceiver } from '@slack/bolt';
import * as dotenv from 'dotenv';

import { registerCommands } from './handlers/commands';
import { registerModalHandlers } from './handlers/modal-submit';
import { registerVotingHandlers } from './handlers/voting';
import { registerSessionActionHandlers } from './handlers/session-actions';

// Load environment variables
dotenv.config();

const isHttpMode = process.env.HTTP_MODE === 'true';

// Validate required environment variables
const requiredEnvVars = ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET'];
if (!isHttpMode) {
  requiredEnvVars.push('SLACK_APP_TOKEN');
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Create the appropriate receiver and app based on mode
let app: App;
let expressApp: any;

if (isHttpMode) {
  // HTTP Mode - for production/serverless
  const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
  });

  app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver,
  });

  expressApp = receiver.app;
} else {
  // Socket Mode - for local development
  app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
  });
}

// Register all handlers
registerCommands(app);
registerModalHandlers(app);
registerVotingHandlers(app);
registerSessionActionHandlers(app);

// Start the app
const port = process.env.PORT || 3000;

(async () => {
  await app.start(port);
  if (isHttpMode) {
    console.log(`Poker Planning app is running in HTTP mode on port ${port}!`);
  } else {
    console.log('Poker Planning app is running in Socket Mode!');
  }
})();

// Export for serverless environments (Vercel, etc.)
export { expressApp as app };
