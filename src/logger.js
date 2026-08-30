'use strict';

const COLORS = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

function print(color, tag, message) {
  // eslint-disable-next-line no-console
  console.log(`${COLORS.gray}[${timestamp()}]${COLORS.reset} ${color}[${tag}]${COLORS.reset} ${message}`);
}

module.exports = {
  info: (msg) => print(COLORS.cyan, 'INFO', msg),
  success: (msg) => print(COLORS.green, 'SUCCESS', msg),
  warn: (msg) => print(COLORS.yellow, 'WARN', msg),
  error: (msg) => print(COLORS.red, 'ERROR', msg),
  voice: (msg) => print(COLORS.magenta, 'VOICE', msg),
  reconnect: (msg) => print(COLORS.blue, 'RECONNECT', msg),
};
