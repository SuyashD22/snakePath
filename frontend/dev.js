const { rmSync } = require('fs');
const { execSync } = require('child_process');

try {
  // Silently wipe the problematic cache to prevent Windows EINVAL crashes
  rmSync('.next', { recursive: true, force: true });
} catch (e) {
  // Ignore
}

// Start the real Next.js server, passing all output back to the terminal
execSync('npx next dev', { stdio: 'inherit' });
