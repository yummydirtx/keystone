#!/usr/bin/env node
// run-tests.js
// Test runner script with proper setup

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Keystone Backend Test Runner');
console.log('================================');

const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      cwd: __dirname,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Command completed successfully`);
        resolve(code);
      } else {
        console.log(`❌ Command failed with code ${code}`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Error running command:`, error);
      reject(error);
    });
  });
};

const main = async () => {
  try {
    console.log('\n📋 Available test commands:');
    console.log('  npm test              - Run all tests');
    console.log('  npm run test:reports  - Run reports API tests');
    console.log('  npm run test:watch    - Run tests in watch mode');
    console.log('  npm run test:coverage - Run tests with coverage');
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('\n🚀 Running all tests...');
      await runCommand('npm', ['test']);
    } else if (args[0] === 'reports') {
      console.log('\n🚀 Running reports tests...');
      await runCommand('npm', ['run', 'test:reports']);
    } else if (args[0] === 'watch') {
      console.log('\n🚀 Running tests in watch mode...');
      await runCommand('npm', ['run', 'test:watch']);
    } else if (args[0] === 'coverage') {
      console.log('\n🚀 Running tests with coverage...');
      await runCommand('npm', ['run', 'test:coverage']);
    } else if (args[0] === 'setup') {
      console.log('\n🔧 Setting up test environment...');
      console.log('1. Make sure you have a test database configured');
      console.log('2. Update .env.test with your test database URL');
      console.log('3. Ensure Firebase service account key is present');
      console.log('4. Run: npm install (if not done already)');
      console.log('\nThen run: node run-tests.js');
    } else {
      console.log(`\n❓ Unknown command: ${args[0]}`);
      console.log('Available commands: reports, watch, coverage, setup');
      process.exit(1);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  }
};

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test execution interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Test execution terminated');
  process.exit(1);
});

main();
