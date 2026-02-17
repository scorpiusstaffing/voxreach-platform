#!/usr/bin/env node

/**
 * Test script to verify maintenance mode is working
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001'; // Change to your backend URL
const ENDPOINTS = [
  '/health',
  '/api/auth/login',
  '/api/agents',
  '/api/campaigns',
  '/api/files',
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({
            endpoint,
            status: res.statusCode,
            maintenance: res.statusCode === 503,
            message: json.message || json.error || 'No message',
          });
        } catch {
          resolve({
            endpoint,
            status: res.statusCode,
            maintenance: res.statusCode === 503,
            message: 'Non-JSON response',
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        endpoint,
        status: 'ERROR',
        maintenance: false,
        message: err.message,
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🔧 Testing VoxReach Maintenance Mode\n');
  console.log('='.repeat(60));

  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    const statusIcon = result.maintenance ? '🛑' : 
                      result.status === 200 ? '✅' : 
                      result.status === 'ERROR' ? '❌' : '⚠️';
    
    console.log(`${statusIcon} ${endpoint}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Maintenance: ${result.maintenance ? 'YES' : 'NO'}`);
    console.log(`   Message: ${result.message}`);
    console.log('');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const maintenanceEndpoints = results.filter(r => r.maintenance);
  const workingEndpoints = results.filter(r => r.status === 200);
  const errorEndpoints = results.filter(r => r.status === 'ERROR');
  
  console.log(`Total endpoints tested: ${results.length}`);
  console.log(`Maintenance mode (503): ${maintenanceEndpoints.length}`);
  console.log(`Working (200): ${workingEndpoints.length}`);
  console.log(`Errors: ${errorEndpoints.length}`);
  
  // Check if maintenance mode is working correctly
  const healthShouldWork = results.find(r => r.endpoint === '/health' && r.status === 200);
  const authShouldWork = results.find(r => r.endpoint === '/api/auth/login' && r.status !== 'ERROR');
  const apiShouldBeBlocked = results.filter(r => 
    !['/health', '/api/auth/login'].includes(r.endpoint) && r.maintenance
  );
  
  console.log('\n🔍 Maintenance Mode Check:');
  if (healthShouldWork) {
    console.log('✅ /health endpoint is accessible');
  } else {
    console.log('❌ /health endpoint should return 200');
  }
  
  if (authShouldWork && authShouldWork.status !== 503) {
    console.log('✅ /api/auth/login is accessible (for waitlist signups)');
  } else {
    console.log('⚠️  /api/auth/login might be blocked');
  }
  
  if (apiShouldBeBlocked.length >= 3) {
    console.log('✅ API endpoints are properly blocked');
  } else {
    console.log('❌ Some API endpoints are not in maintenance mode');
  }
  
  console.log('\n💡 To test locally:');
  console.log('1. Start backend: cd packages/backend && npm run dev');
  console.log('2. Run this test: node test-maintenance.js');
  console.log('3. Check frontend: cd packages/frontend && npm run dev');
}

// Check if backend is running
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      timeout: 2000,
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
};

async function main() {
  const isServerRunning = await checkServer();
  
  if (!isServerRunning) {
    console.log('⚠️  Backend server not running on localhost:3001');
    console.log('Starting backend in development mode...\n');
    
    // Try to start the backend
    const { spawn } = require('child_process');
    const backend = spawn('npm', ['run', 'dev'], {
      cwd: 'packages/backend',
      stdio: 'inherit',
      shell: true,
    });
    
    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check again
    const isNowRunning = await checkServer();
    if (!isNowRunning) {
      console.log('❌ Failed to start backend server');
      console.log('Please start it manually: cd packages/backend && npm run dev');
      process.exit(1);
    }
  }
  
  await runTests();
}

if (require.main === module) {
  main().catch(console.error);
}