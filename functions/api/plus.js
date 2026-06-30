import { onRequestGet as handleGet, onRequestOptions as handleOptions } from './qr.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context) {
  context.data = { isSecureRoute: true };
  return handleGet(context);
}
