import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { registerCompanyCommands } from '../../../src/commands/company.js';

describe('company commands', () => {
  it('should register all company subcommands', () => {
    const program = new Command();
    program.option('--json').option('--all');
    registerCompanyCommands(program);
    const company = program.commands.find(c => c.name() === 'company');
    expect(company).toBeDefined();

    const subcommands = company!.commands.map(c => c.name());
    expect(subcommands).toContain('list');
    expect(subcommands).toContain('search');
    expect(subcommands).toContain('details');
    expect(subcommands).toContain('dividends');
    expect(subcommands).toContain('fiscal-periods');
    expect(subcommands).toContain('splits');
  });
});
