'use strict';

const { Events } = require('discord.js');

const config = require('../config');
const logger = require('../logger');
const { joinTargetVoiceChannel, isConnectedToVoice } = require('../voice');

// Small grace delay before this handler acts. The connection-level
// listener in src/voice.js is the primary authority for deciding whether
// a disconnect is a recoverable blip or a real drop (it waits up to 30s
// for self-heal). This handler is a secondary safety net for cases like
// the bot's own connection object never existing in the first place —
// so it waits briefly and then only acts if voice.js hasn't already
// reconnected, to avoid two rejoin attempts racing each other.
const SAFETY_NET_DELAY_MS = 3000;

/**
 * Fires whenever any member's voice state changes. Used here to detect
 * when the BOT ITSELF is kicked from voice or moved to a different
 * channel, so it can rejoin the target channel automatically.
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 */
module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(oldState, newState) {
    const client = newState.client;

    // Only react to changes involving the bot itself.
    if (oldState.id !== client.user.id) {
      return;
    }

    // Bot was disconnected from voice entirely (kicked, or the connection
    // dropped). Give the primary self-heal logic in voice.js a brief
    // window to handle it before stepping in.
    if (oldState.channelId && !newState.channelId) {
      setTimeout(async () => {
        if (isConnectedToVoice()) {
          // voice.js already recovered (or reconnected) — nothing to do.
          return;
        }
        logger.warn('Bot has no active voice connection after being disconnected. Rejoining...');
        await joinTargetVoiceChannel(client);
      }, SAFETY_NET_DELAY_MS);
      return;
    }

    // Bot was moved to a different channel than the configured target.
    if (newState.channelId && newState.channelId !== config.voiceChannelId) {
      logger.warn('Bot was moved to a different voice channel. Returning to target channel...');
      await joinTargetVoiceChannel(client);
    }
  },
};
