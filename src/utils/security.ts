// Web Crypto salted PBKDF2 PIN hashing & Weak PIN validator & WebAuthn Biometrics

const WEAK_PINS = new Set([
  '00000', '11111', '22222', '33333', '44444',
  '55555', '66666', '77777', '88888', '99999',
  '01234', '12345', '23456', '34567', '45678', '56789',
  '98765', '87654', '76543', '65432', '54321', '43210',
  '12121', '10101', '11223',
]);

export function isWeakPin(pin: string): boolean {
  if (!/^\d{5}$/.test(pin)) return true;
  if (WEAK_PINS.has(pin)) return true;

  // Check if all digits are identical
  if (new Set(pin.split('')).size === 1) return true;

  // Check strictly sequential ascending or descending
  let isAsc = true;
  let isDesc = true;
  for (let i = 1; i < pin.length; i++) {
    const diff = Number(pin[i]) - Number(pin[i - 1]);
    if (diff !== 1) isAsc = false;
    if (diff !== -1) isDesc = false;
  }
  return isAsc || isDesc;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : '0' + hex;
  const arr = new Uint8Array(clean.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

export function generateSaltHex(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return bytesToHex(salt);
}

export async function hashPinPBKDF2(pin: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const saltBytes = hexToBytes(saltHex);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(derivedBits));
}

export async function verifyPinHash(pin: string, expectedHash: string, saltHex: string): Promise<boolean> {
  if (!expectedHash || !saltHex) return false;
  const actual = await hashPinPBKDF2(pin, saltHex);
  // Constant-time comparison
  if (actual.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}

export async function isBiometricSupported(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerBiometricCredential(userId: string, userName: string): Promise<string | null> {
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userBytes = new TextEncoder().encode(userId.slice(0, 32));
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'LifeTrack' },
        user: {
          id: userBytes,
          name: userName || 'LifeTrack User',
          displayName: userName || 'LifeTrack User',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 45000,
      },
    })) as PublicKeyCredential | null;
    if (!cred) return null;
    return btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
  } catch {
    return null;
  }
}

export async function authenticateBiometricCredential(credentialIdBase64: string): Promise<boolean> {
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const rawId = Uint8Array.from(atob(credentialIdBase64), (c) => c.charCodeAt(0));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: rawId, type: 'public-key' }],
        userVerification: 'required',
        timeout: 45000,
      },
    });
    return Boolean(assertion);
  } catch {
    return false;
  }
}

export function playTimerChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.16);
      osc.stop(ctx.currentTime + idx * 0.16 + 0.46);
    });
  } catch {
    // Silent fallback when audio gesture unavailable
  }
  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate([180, 80, 180]);
    }
  } catch {
    // Ignore vibration errors
  }
}
