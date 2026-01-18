import { App } from '@slack/bolt';
import * as dotenv from 'dotenv';

import { registerCommands } from './handlers/commands';
import { registerModalHandlers } from './handlers/modal-submit';
import { registerVotingHandlers } from './handlers/voting';
import { registerSessionActionHandlers } from './handlers/session-actions';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['SLACK_BOT_TOKEN', 'SLACK_APP_TOKEN', 'SLACK_SIGNING_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize the Bolt app with Socket Mode
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Register all handlers
registerCommands(app);
registerModalHandlers(app);
registerVotingHandlers(app);
registerSessionActionHandlers(app);

// Start the app
(async () => {
  await app.start();
  console.log('Poker Planning app is running!');
})();
