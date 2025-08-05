// Temporary server file to fix the build process
// This file redirects to the Vite development server

import { exec } from 'child_process';
import path from 'path';

console.log('Starting TenderTracker Pro development server...');
console.log('Redirecting to Vite development server...');

// Change to client directory and start Vite
const clientPath = path.join(process.cwd(), 'client');
process.chdir(clientPath);

// Start Vite development server
const viteProcess = exec('npx vite --host 0.0.0.0 --port 8080', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error starting Vite: ${error}`);
    return;
  }
  console.log(stdout);
  if (stderr) {
    console.error(stderr);
  }
});

viteProcess.stdout?.on('data', (data) => {
  console.log(data);
});

viteProcess.stderr?.on('data', (data) => {
  console.error(data);
});

process.on('SIGINT', () => {
  console.log('Shutting down development server...');
  viteProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down development server...');
  viteProcess.kill();
  process.exit(0);
});