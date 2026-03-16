import { describe, it, expect } from 'vitest';
import { Command } from 'commander';

// We need to import the register function and verify it creates the right commands
import { registerFinancialsCommands } from '../../../src/commands/financials.js';

describe('financials commands', () => {
  it('should register all financial statement subcommands', () => {
    const program = new Command();
    registerFinancialsCommands(program);
    const financials = program.commands.find(c => c.name() === 'financials');
    expect(financials).toBeDefined();

    const subcommands = financials!.commands.map(c => c.name());
    expect(subcommands).toContain('income-statement');
    expect(subcommands).toContain('balance-sheet');
    expect(subcommands).toContain('cash-flow');
    expect(subcommands).toContain('snapshot');
  });

  it('income-statement should have --as-reported and --detailed options', () => {
    const program = new Command();
    registerFinancialsCommands(program);
    const financials = program.commands.find(c => c.name() === 'financials');
    const incomeStatement = financials!.commands.find(c => c.name() === 'income-statement');

    const optionNames = incomeStatement!.options.map(o => o.long);
    expect(optionNames).toContain('--identifier');
    expect(optionNames).toContain('--period');
    expect(optionNames).toContain('--detailed');
    expect(optionNames).toContain('--presentation');
    expect(optionNames).toContain('--as-reported');
    expect(optionNames).toContain('--with-formula');
  });

  it('snapshot should use --identifiers (plural)', () => {
    const program = new Command();
    registerFinancialsCommands(program);
    const financials = program.commands.find(c => c.name() === 'financials');
    const snapshot = financials!.commands.find(c => c.name() === 'snapshot');

    const optionNames = snapshot!.options.map(o => o.long);
    expect(optionNames).toContain('--identifiers');
    expect(optionNames).toContain('--calendar-year');
    expect(optionNames).toContain('--calendar-quarter');
  });
});
