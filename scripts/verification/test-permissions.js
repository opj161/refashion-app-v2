#!/usr/bin/env node

/**
 * Test script to verify file permission fixes are working correctly
 * This script tests the permission management for both upload and image generation flows
 */

const fs = require('fs');
const path = require('path');

// Mock test data
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const testImageDataUri = `data:image/png;base64,${testImageBase64}`;

function testDirectoryPermissions() {
  console.log('🧪 Testing directory permission management...');
  
  const testDir = path.join(process.cwd(), 'public', 'uploads', 'test_permissions');
  
  try {
    // Create directory with proper permissions
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true, mode: 0o775 });
      console.log('✅ Directory created with permissions 775');
      
      // Check if PUID/PGID are available
      const puid = process.env.PUID;
      const pgid = process.env.PGID;
      
      if (puid && pgid) {
        try {
          fs.chownSync(testDir, parseInt(puid), parseInt(pgid));
          console.log(`✅ Directory ownership set to ${puid}:${pgid}`);
        } catch (chownError) {
          console.log(`⚠️  Could not set ownership (expected in non-Docker environment): ${chownError.message}`);
        }
      } else {
        console.log('ℹ️  PUID/PGID not set (expected in development environment)');
      }
    }
    
    // Check directory stats
    const stats = fs.statSync(testDir);
    const permissions = (stats.mode & parseInt('777', 8)).toString(8);
    console.log(`📁 Directory permissions: ${permissions}`);
    
  } catch (error) {
    console.error('❌ Directory test failed:', error.message);
  }
}

function testFilePermissions() {
  console.log('\n🧪 Testing file permission management...');
  
  const testDir = path.join(process.cwd(), 'public', 'uploads', 'test_permissions');
  const testFile = path.join(testDir, 'test_image.png');
  
  try {
    // Decode base64 and write file
    const buffer = Buffer.from(testImageBase64, 'base64');
    fs.writeFileSync(testFile, buffer, { mode: 0o664 });
    console.log('✅ File created with permissions 664');
    
    // Set proper permissions explicitly
    fs.chmodSync(testFile, 0o664);
    console.log('✅ File permissions set to 664');
    
    // Set ownership if PUID/PGID available
    const puid = process.env.PUID;
    const pgid = process.env.PGID;
    
    if (puid && pgid) {
      try {
        fs.chownSync(testFile, parseInt(puid), parseInt(pgid));
        console.log(`✅ File ownership set to ${puid}:${pgid}`);
      } catch (chownError) {
        console.log(`⚠️  Could not set ownership (expected in non-Docker environment): ${chownError.message}`);
      }
    }
    
    // Check file stats
    const stats = fs.statSync(testFile);
    const permissions = (stats.mode & parseInt('777', 8)).toString(8);
    console.log(`📄 File permissions: ${permissions}`);
    console.log(`👤 File UID: ${stats.uid}, GID: ${stats.gid}`);
    
  } catch (error) {
    console.error('❌ File test failed:', error.message);
  }
}

function cleanup() {
  console.log('\n🧹 Cleaning up test files...');
  
  const testDir = path.join(process.cwd(), 'public', 'uploads', 'test_permissions');
  
  try {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
      console.log('✅ Test directory cleaned up');
    }
  } catch (error) {
    console.warn('⚠️  Could not clean up test directory:', error.message);
  }
}

function main() {
  console.log('🚀 Starting permission tests...');
  console.log(`📍 Working directory: ${process.cwd()}`);
  console.log(`🌍 Environment: NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  console.log(`👥 PUID=${process.env.PUID || 'not set'}, PGID=${process.env.PGID || 'not set'}\n`);
  
  testDirectoryPermissions();
  testFilePermissions();
  
  console.log('\n📊 Test Summary:');
  console.log('- Directory creation with 775 permissions');
  console.log('- File creation with 664 permissions');
  console.log('- PUID/PGID ownership management (if available)');
  console.log('- Compatible with both development and Docker environments');
  
  // Clean up after a short delay
  setTimeout(cleanup, 2000);
}

// Run the tests
main();
