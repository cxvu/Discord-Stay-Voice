'use strict';

require('dotenv').config();

const REQUIRED_ENV_VARS = ['BOT_TOKEN', 'GUILD_ID', 'VOICE_CHANNEL_ID'];

/**
 * Validates that all required environment variables are present.
 * Exits the process with a clear error message if any are missing.
 */
function validateConfig() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key] || process.env[key].trim() === '');

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] Missing required environment variable(s): ${missing.join(', ')}`);
    // eslint-disable-next-line no-console
    console.error('[ERROR] Please check your .env file and fill in all required values.');
    process.exit(1);
  }
}

validateConfig();

const config = {
  botToken: process.env.BOT_TOKEN.trim(),
  guildId: process.env.GUILD_ID.trim(),
  voiceChannelId: process.env.VOICE_CHANNEL_ID.trim(),
  // Static Twitch "Streaming" presence (purple status). Both must be set
  // for the streaming presence to be applied; otherwise it's skipped.
  twitch: {
    name: (process.env.TWITCH_STREAM_NAME || '').trim(),
    url: (process.env.TWITCH_STREAM_URL || '').trim(),
  },
};

module.exports = config;
