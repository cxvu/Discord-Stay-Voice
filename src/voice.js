'use strict';

const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} = require('@discordjs/voice');

const config = require('./config');
const logger = require('./logger');

const RECONNECT_RETRY_DELAY_MS = 5000; // 5 seconds between manual retry attempts
const DISCONNECT_RECOVERY_TIMEOUT_MS = 30000; // how long to wait for @discordjs/voice's own auto-recovery
const STATE_CHANGE_TIMEOUT_MS = 20000; // timeout for a fresh join to reach Ready

let reconnectTimer = null;
let isConnecting = false;

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect(client) {
  clearReconnectTimer();
  logger.reconnect(`Retrying in ${RECONNECT_RETRY_DELAY_MS / 1000} second(s)...`);
  reconnectTimer = setTimeout(() => {
    joinTargetVoiceChannel(client).catch((error) => {
      logger.error(`Unexpected error while reconnecting: ${error.message}`);
      scheduleReconnect(client);
    });
  }, RECONNECT_RETRY_DELAY_MS);
}

function safeDestroy(connection) {
  try {
    if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed) {
      connection.destroy();
    }
  } catch (error) {
    logger.error(`Failed to destroy stale voice connection: ${error.message}`);
  }
}

function attachConnectionListeners(connection, client) {
  connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
    // @discordjs/voice fires Disconnected for both recoverable network blips
    // (Discord's own reconnect logic will bring it back to Ready by itself)
    // and unrecoverable drops (kicked, channel deleted, permissions revoked).
    // We must NOT manually rejoin on every blip — that's what was causing
    // the bot to bounce connect/disconnect repeatedly. Instead we wait
    // patiently for the connection to either self-heal back to Ready, or
    // definitively die (Destroyed), before doing anything ourselves.
    const closeCode = newState?.reason === 0 ? newState?.closeCode : undefined;
    logger.warn(
      `Voice connection reported Disconnected${
        closeCode !== undefined ? ` (close code ${closeCode})` : ''
      }. Waiting for it to self-heal...`
    );

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, DISCONNECT_RECOVERY_TIMEOUT_MS);
      logger.success('Voice connection recovered on its own. Still staying in the channel.');
    } catch {
      // Did not recover within the grace period — this is a real drop.
      // Only now do we tear down and schedule a manual rejoin.
      logger.warn('Voice connection did not self-heal in time. Rejoining manually...');
      safeDestroy(connection);
      scheduleReconnect(client);
    }
  });

  connection.on(VoiceConnectionStatus.Destroyed, () => {
    logger.warn('Voice connection was destroyed.');
    scheduleReconnect(client);
  });

  connection.on('error', (error) => {
    logger.error(`Voice connection error: ${error.message}`);
  });
}

/**
 * Joins the configured voice channel and waits until the connection is ready.
 * If the bot is already connected to the correct channel, this is a no-op.
 * @param {import('discord.js').Client} client
 */
async function joinTargetVoiceChannel(client) {
  if (isConnecting) return;
  isConnecting = true;

  try {
    clearReconnectTimer();

    const guild = await client.guilds.fetch(config.guildId);
    if (!guild) {
      logger.error(`Guild with ID "${config.guildId}" was not found. Retrying...`);
      scheduleReconnect(client);
      return;
    }

    const channel = await guild.channels.fetch(config.voiceChannelId).catch(() => null);
    if (!channel || !channel.isVoiceBased()) {
      logger.error(
        `Voice channel with ID "${config.voiceChannelId}" was not found or is not a voice channel. Retrying...`
      );
      scheduleReconnect(client);
      return;
    }

    const existingConnection = getVoiceConnection(config.guildId);
    if (
      existingConnection &&
      existingConnection.state.status === VoiceConnectionStatus.Ready &&
      existingConnection.joinConfig.channelId === config.voiceChannelId
    ) {
      logger.info('Already connected to the target voice channel. Skipping join.');
      return;
    }

    if (existingConnection) {
      safeDestroy(existingConnection);
    }

    logger.voice(`Joining voice channel "${channel.name}" (${channel.id})...`);

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false,
    });

    attachConnectionListeners(connection, client);

    await entersState(connection, VoiceConnectionStatus.Ready, STATE_CHANGE_TIMEOUT_MS);
    logger.success(`Successfully connected to "${channel.name}". Staying 24/7.`);
  } catch (error) {
    logger.error(`Failed to join voice channel: ${error.message}`);
    scheduleReconnect(client);
  } finally {
    isConnecting = false;
  }
}

/**
 * Returns whether the bot currently has an active, ready voice connection
 * in the configured guild.
 * @returns {boolean}
 */
function isConnectedToVoice() {
  const connection = getVoiceConnection(config.guildId);
  return Boolean(connection && connection.state.status === VoiceConnectionStatus.Ready);
}

module.exports = {
  joinTargetVoiceChannel,
  isConnectedToVoice,
};
