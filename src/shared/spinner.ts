import ora, { type Ora } from 'ora';

let jsonMode = false;

export function setJsonMode(enabled: boolean): void {
  jsonMode = enabled;
}

export function createSpinner(text: string): Ora {
  if (jsonMode) {
    return ora({ text, isSilent: true });
  }
  return ora(text).start();
}
