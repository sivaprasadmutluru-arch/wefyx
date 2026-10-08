import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Keychain from 'react-native-keychain';

const SESSION_SERVICE = 'pro.wefyx.mobile.session';

export async function saveSessionToken(token: string) {
  await Keychain.setGenericPassword('wefyx-session', token, {
    service: SESSION_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getSessionToken() {
  const credentials = await Keychain.getGenericPassword({ service: SESSION_SERVICE });
  return credentials ? credentials.password : null;
}

export async function clearSessionToken() {
  await Keychain.resetGenericPassword({ service: SESSION_SERVICE });
}

export const API_ORIGIN =
  Platform.OS === 'ios'
    ? 'https://wefyx.pro'
    : __DEV__
      ? 'http://10.0.2.2:8080'
      : 'https://wefyx.pro';
export const API_BASE = `${API_ORIGIN}/api`;

let unauthorizedHandler: (() => void) | undefined;

export function setUnauthorizedHandler(handler?: () => void) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function headers(json = false) {
  const token = await getSessionToken();
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function ensureConnected() {
  const network = await NetInfo.fetch();
  // `isInternetReachable` can be false on emulators, VPNs, and private networks
  // even when the configured API host is reachable. Only reject a confirmed
  // disconnected transport and let fetch report host-specific failures.
  if (network.isConnected === false) {
    throw new ApiError('No internet connection. Reconnect and try again.', 0);
  }
}

async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      await Promise.all([
        clearSessionToken(),
        AsyncStorage.removeItem('wefyx-user'),
      ]);
      unauthorizedHandler?.();
    }
    throw new ApiError(
      body.message ||
        (response.status === 401
          ? 'Your session has expired. Please sign in again.'
          : `Request failed: ${response.status}`),
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function apiLogin(identifier: string, password: string) {
  await ensureConnected();
  const clean = identifier.trim();
  return read<{
    token: string;
    user: { name: string; email: string; role: string };
  }>(
    await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: clean, password }),
    }),
  );
}

export async function apiRequestLoginOtp(phone: string) {
  await ensureConnected();
  return read<{ success: boolean; message: string; phone: string; delivery: string }>(
    await fetch(`${API_BASE}/auth/login/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    }),
  );
}

export async function apiVerifyPhoneLogin(phone: string, otp: string) {
  await ensureConnected();
  return read<{
    token: string;
    user: { name: string; email: string; role: string };
  }>(
    await fetch(`${API_BASE}/auth/login/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    }),
  );
}

export async function apiGet<T>(path: string): Promise<T> {
  await ensureConnected();
  return read<T>(
    await fetch(`${API_BASE}${path}`, { headers: await headers() }),
  );
}

export async function apiSend<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  await ensureConnected();
  return read<T>(
    await fetch(`${API_BASE}${path}`, {
      method,
      headers: await headers(true),
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}

export async function apiUpload(path: string, files: { uri?: string; fileName?: string; type?: string }[]) {
  await ensureConnected();
  const body = new FormData();
  files.forEach((file, index) => {
    if (!file.uri) throw new Error('The selected photo is unavailable. Please select it again.');
    body.append('files', { uri: file.uri, name: file.fileName || `photo-${index}.jpg`, type: file.type || 'image/jpeg' } as unknown as Blob);
  });
  return read(await fetch(`${API_BASE}${path}`, { method: 'POST', headers: await headers(), body }));
}
