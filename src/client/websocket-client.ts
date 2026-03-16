import { getApiKey } from '../config/auth.js';
import { getBaseUrl } from '../config/config-manager.js';
import chalk from 'chalk';

export async function connectWebSocket(): Promise<void> {
  const apiKey = await getApiKey();
  const base = getBaseUrl().replace(/\/+$/, '').replace(/^http/, 'ws');
  const url = `${base}/v1/ws?api_key=${encodeURIComponent(apiKey)}`;

  let reconnectDelay = 1000;
  let shouldReconnect = true;

  function connect() {
    console.log(chalk.dim('Connecting to WebSocket...'));
    const ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      console.log(chalk.green('Connected to filing stream'));
      reconnectDelay = 1000;
    });

    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data.type === 'ping') return;
        if (data.type === 'new_filing') {
          const f = data.filing;
          console.log(chalk.bold(`[${f.form_type}]`) + ` ${f.cik} - Filed ${f.filing_date}`);
          if (f.html_url) console.log(chalk.dim(`  ${f.html_url}`));
        } else {
          console.log(JSON.stringify(data, null, 2));
        }
      } catch {
        console.log(String(event.data));
      }
    });

    ws.addEventListener('close', () => {
      if (shouldReconnect) {
        console.log(chalk.yellow(`Disconnected. Reconnecting in ${reconnectDelay / 1000}s...`));
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      }
    });

    ws.addEventListener('error', (error) => {
      console.error(chalk.red('WebSocket error:'), error);
    });

    process.on('SIGINT', () => {
      shouldReconnect = false;
      ws.close();
      console.log(chalk.dim('\nDisconnected.'));
      process.exit(0);
    });
  }

  connect();

  // Keep process alive
  await new Promise(() => {});
}
