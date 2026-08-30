'use strict';

const { ActivityType } = require('discord.js');

const config = require('./config');
const logger = require('./logger');

// Discord only renders the purple "Streaming" status when the activity
// type is Streaming AND the url points to a recognized Twitch/YouTube URL.
const TWITCH_URL_PATTERN = /^https?:\/\/(www\.)?twitch\.tv\/.+/i;

/**
 * Applies the static "Streaming" presence (purple status) using the
 * Twitch name/url configured in the environment. No-op if either value
 * is missing or the URL isn't a valid Twitch URL.
 * @param {import('discord.js').Client} client
 */
function applyStreamingPresence(client) {
  const { name, url } = config.twitch;

  if (!name || !url) {
    logger.warn('TWITCH_STREAM_NAME or TWITCH_STREAM_URL not set. Skipping streaming presence.');
    return;
  }

  if (!TWITCH_URL_PATTERN.test(url)) {
    logger.warn(`TWITCH_STREAM_URL "${url}" does not look like a valid Twitch URL. Skipping streaming presence.`);
    return;
  }

  client.user.setPresence({
    activities: [
      {
        name,
        type: ActivityType.Streaming,
        url,
      },
    ],
    status: 'online',
  });

  logger.success(`Presence set to Streaming: "${name}" (${url})`);
}

module.exports = {
  applyStreamingPresence,
};
