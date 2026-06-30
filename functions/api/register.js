/**
 * POST /api/register
 * Request body (JSON):
 *   email: string
 *   token: string (Turnstile verification response)
 */

async function generateHmacSignature(message, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  
  // Convert buffer to base64url
  const uint8 = new Uint8Array(sigBuffer);
  let binary = '';
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Ensure JSON request
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { email, token } = body;

  if (!email || !token) {
    return new Response(JSON.stringify({ error: 'Email and Turnstile token are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Validate email format basic check
  if (!email.includes('@') || email.length < 5) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 1. Verify Turnstile Token
  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  if (!turnstileSecret) {
    // If not configured, fail safe or allow in dev mode
    console.warn('TURNSTILE_SECRET_KEY is not configured.');
  } else {
    const clientIp = request.headers.get('CF-Connecting-IP') || '';
    const verificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    
    try {
      const response = await fetch(verificationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(token)}&remoteip=${encodeURIComponent(clientIp)}`
      });
      const outcome = await response.json();
      
      if (!outcome.success) {
        return new Response(JSON.stringify({ error: 'Turnstile verification failed. Please try again.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Error validating captcha token.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 2. Generate HMAC-signed API key
  const signingSecret = env.API_SIGNING_SECRET;
  if (!signingSecret) {
    return new Response(JSON.stringify({ error: 'API signature configuration error on the server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Expiration date: 365 days from now
  const validityDays = 365;
  const expirationTime = Date.now() + (validityDays * 24 * 60 * 60 * 1000);
  
  // Format identity: base64(email):expirationTime
  const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const rawKeyData = `${encodedEmail}:${expirationTime}`;
  
  try {
    const signature = await generateHmacSignature(rawKeyData, signingSecret);
    const apiKey = `${rawKeyData}:${signature}`;

    return new Response(JSON.stringify({ apiKey, expiresAt: new Date(expirationTime).toISOString() }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to generate API Key' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
