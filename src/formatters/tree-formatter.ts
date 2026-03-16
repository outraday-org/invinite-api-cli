import chalk from 'chalk';

interface TreeNode {
  concept?: string;
  metric_id?: string;
  label?: string;
  value?: number | null;
  depth?: number;
  isTotal?: boolean;
  children?: TreeNode[];
}

export function formatTree(nodes: TreeNode[], indent: number = 0): void {
  for (const node of nodes) {
    const prefix = '  '.repeat(indent);
    const label = node.label || node.metric_id || node.concept || 'Unknown';
    const value = node.value !== null && node.value !== undefined ? formatTreeValue(node.value) : '';

    if (node.isTotal) {
      console.log(`${prefix}${chalk.bold(label)}${value ? '  ' + chalk.bold(value) : ''}`);
    } else if (node.children && node.children.length > 0) {
      console.log(`${prefix}${chalk.cyan(label)}${value ? '  ' + value : ''}`);
    } else {
      console.log(`${prefix}${label}${value ? '  ' + chalk.dim(value) : ''}`);
    }

    if (node.children) {
      formatTree(node.children, indent + 1);
    }
  }
}

function formatTreeValue(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(n) >= 1_000) {
    return `${(n / 1_000).toFixed(1)}K`;
  }
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
