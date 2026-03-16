import { getStoredApiKey, setStoredApiKey } from './config-manager.js';

interface KeytarLike {
  getPassword: (service: string, account: string) => Promise<string | null>;
  setPassword: (service: string, account: string, password: string) => Promise<void>;
}

async function tryKeytar(): Promise<KeytarLike | null> {
  try {
    // Dynamic import - keytar is optional
    const mod = await (Function('return import("keytar")')() as Promise<unknown>);
    return mod as KeytarLike;
  } catch {
    return null;
  }
}

const SERVICE = 'invinite-cli';
const ACCOUNT = 'api-key';

export async function getApiKey(): Promise<string> {
  // 1. Environment variable (highest priority)
  const envKey = process.env.INVINITE_API_KEY;
  if (envKey) return envKey;

  // 2. OS keychain via keytar
  const keytar = await tryKeytar();
  if (keytar) {
    const keychainKey = await keytar.getPassword(SERVICE, ACCOUNT);
    if (keychainKey) return keychainKey;
  }

  // 3. Conf fallback
  const storedKey = getStoredApiKey();
  if (storedKey) return storedKey;

  throw new Error('No API key configured. Run: invinite config set-key');
}

export async function setApiKey(key: string): Promise<void> {
  const keytar = await tryKeytar();
  if (keytar) {
    await keytar.setPassword(SERVICE, ACCOUNT, key);
  } else {
    setStoredApiKey(key);
  }
}
