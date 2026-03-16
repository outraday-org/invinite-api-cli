import chalk from 'chalk';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorType: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function withErrorHandling(fn: (...args: any[]) => Promise<void>) {
  return async (...args: any[]) => {
    try {
      await fn(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(chalk.red(`Error ${error.statusCode}: ${error.errorType}`));
        console.error(error.message);
      } else if (error instanceof Error) {
        console.error(chalk.red('Error:'), error.message);
      } else {
        console.error(chalk.red('An unexpected error occurred'));
      }
      process.exit(1);
    }
  };
}
