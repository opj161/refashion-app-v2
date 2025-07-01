#!/usr/bin/env node

/**
 * Test script to verify that the SSR authentication fix is working correctly.
 * 
 * This script checks that:
 * 1. getCurrentUser() is not called during build time
 * 2. Dynamic rendering is properly configured
 * 3. No build-time authentication errors occur
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing SSR Authentication Fix...\n');

// Clean up any existing build artifacts
const buildDir = path.join(__dirname, '.next');
if (fs.existsSync(buildDir)) {
  console.log('🧹 Cleaning existing build directory...');
  fs.rmSync(buildDir, { recursive: true, force: true });
}

// Run the build process
console.log('🏗️  Running Next.js build...');
const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'pipe',
  shell: true,
  cwd: __dirname
});

let buildOutput = '';
let hasAuthCalls = false;
let buildSuccessful = false;

buildProcess.stdout.on('data', (data) => {
  const output = data.toString();
  buildOutput += output;
  
  // Check for authentication function calls during build
  if (output.includes('[getCurrentUser] Attempting to fetch current user session')) {
    hasAuthCalls = true;
    console.log('❌ Found authentication calls during build time!');
  }
  
  // Check for successful build completion
  if (output.includes('✓ Compiled successfully')) {
    buildSuccessful = true;
  }
  
  process.stdout.write(output);
});

buildProcess.stderr.on('data', (data) => {
  const output = data.toString();
  buildOutput += output;
  process.stderr.write(output);
});

buildProcess.on('close', (code) => {
  console.log('\n📊 Test Results:');
  console.log('================');
  
  if (code === 0) {
    console.log('✅ Build completed successfully');
  } else {
    console.log('❌ Build failed with exit code:', code);
  }
  
  if (!hasAuthCalls) {
    console.log('✅ No authentication calls during build time');
  } else {
    console.log('❌ Authentication calls found during build time');
  }
  
  // Check for dynamic route configuration
  const hasDynamicConfig = buildOutput.includes('ƒ') || buildOutput.includes('λ') || buildOutput.includes('(Dynamic)');
  if (hasDynamicConfig) {
    console.log('✅ Dynamic rendering configuration detected');
  } else {
    console.log('⚠️  Could not confirm dynamic rendering configuration');
  }
  
  console.log('\n📋 Summary:');
  if (code === 0 && !hasAuthCalls) {
    console.log('🎉 SSR Authentication Fix: SUCCESS');
    console.log('   - Build completed without errors');
    console.log('   - No authentication calls during build time');
    console.log('   - Layout should now be dynamically rendered at request time');
  } else {
    console.log('❌ SSR Authentication Fix: FAILED');
    console.log('   - Authentication state may still be incorrectly determined at build time');
    console.log('   - Users may experience hydration mismatches');
  }
  
  process.exit(code);
});

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test interrupted');
  buildProcess.kill();
  process.exit(1);
});
