/**
 * Expo Push Notification service
 * Sends notifications via Expo's push API.
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */
const fetch = require('node-fetch');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send one or more Expo push messages.
 * @param {Array<{ to: string, title?: string, body?: string, data?: object, sound?: 'default' | null, channelId?: string }>} messages
 * @returns {Promise<{ tickets: any[] }>}
 */
async function sendExpoPush(messages) {
  if (!Array.isArray(messages)) {
    messages = [messages];
  }

  // Basic validation: Expo tokens must start with ExponentPushToken[
  const invalid = messages.filter((m) => !m.to || !m.to.startsWith('ExponentPushToken['));
  if (invalid.length > 0) {
    console.warn(
      'Some push tokens are not valid Expo tokens. They will likely fail.',
      invalid.map((i) => i.to)
    );
  }

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'accept-encoding': 'gzip, deflate',
      'content-type': 'application/json'
    },
    body: JSON.stringify(messages)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Expo push send failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return { tickets: json.data || [] };
}

module.exports = {
  sendExpoPush
};
