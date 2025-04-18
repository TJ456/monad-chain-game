// Custom build script to work around Rollup issues on Vercel
import { execSync } from 'child_process';

try {
  // First try to install the specific Rollup binary needed
  console.log('Installing Rollup dependencies...');
  execSync('npm install @rollup/rollup-linux-x64-gnu --no-save', { stdio: 'inherit' });
  
  // Then run the build
  console.log('Running build...');
  execSync('vite build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
