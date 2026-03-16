import { Command } from 'commander';
import { connectWebSocket } from '../client/websocket-client.js';
import { withErrorHandling } from '../shared/errors.js';

export function registerWsCommands(program: Command): void {
  const ws = program
    .command('ws')
    .description('WebSocket streaming');

  ws
    .command('listen')
    .description('Listen to real-time SEC filing stream')
    .action(withErrorHandling(async () => {
      await connectWebSocket();
    }));
}
