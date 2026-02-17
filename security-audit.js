#!/usr/bin/env node

/**
 * VoxReach Security Audit Script
 * Run this to check for common security issues in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'packages/backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'packages/frontend');

const ISSUES = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  info: []
};

function addIssue(severity, title, description, file, line = null) {
  ISSUES[severity].push({
    title,
    description,
    file: file ? path.relative(ROOT_DIR, file) : null,
    line
  });
}

function checkEnvFiles() {
  console.log('🔍 Checking environment files...');
  
  const backendEnv = path.join(BACKEND_DIR, '.env');
  if (fs.existsSync(backendEnv)) {
    const content = fs.readFileSync(backendEnv, 'utf8');
    
    // Check for default JWT secret
    if (content.includes('your-jwt-secret-key-change-in-production')) {
      addIssue('critical', 
        'Default JWT Secret in .env',
        'Using default JWT secret. Generate a strong random secret for production.',
        backendEnv
      );
    }
    
    // Check for test Stripe keys
    if (content.includes('sk_test_') || content.includes('pk_test_')) {
      addIssue('high',
        'Stripe Test Keys in Production',
        'Using Stripe test keys. Switch to live keys for production deployment.',
        backendEnv
      );
    }
    
    // Check for weak passwords in DB URL
    if (content.includes('user:password')) {
      addIssue('high',
        'Default Database Credentials',
        'Using default database credentials. Change to strong, unique credentials.',
        backendEnv
      );
    }
  }
  
  const frontendEnvProd = path.join(FRONTEND_DIR, '.env.production');
  if (fs.existsSync(frontendEnvProd)) {
    const content = fs.readFileSync(frontendEnvProd, 'utf8');
    
    // Check for test Stripe keys in production frontend
    if (content.includes('pk_test_')) {
      addIssue('high',
        'Stripe Test Publishable Key in Production',
        'Using Stripe test publishable key in production frontend.',
        frontendEnvProd
      );
    }
  }
}

function checkDependencies() {
  console.log('📦 Checking dependencies...');
  
  try {
    const backendPackage = JSON.parse(fs.readFileSync(path.join(BACKEND_DIR, 'package.json'), 'utf8'));
    const frontendPackage = JSON.parse(fs.readFileSync(path.join(FRONTEND_DIR, 'package.json'), 'utf8'));
    
    // Check for known vulnerable packages
    const vulnerablePackages = {
      'jsonwebtoken': '<9.0.0', // CVE-2022-23529, CVE-2022-23540, CVE-2022-23541
      'express': '<4.18.0', // Various security fixes
      'helmet': '<7.0.0', // Security header improvements
    };
    
    function checkPackage(pkg, dir) {
      for (const [pkgName, minVersion] of Object.entries(vulnerablePackages)) {
        if (pkg.dependencies?.[pkgName]) {
          const version = pkg.dependencies[pkgName];
          if (version.match(/[0-9]/) && version < minVersion.replace('<', '')) {
            addIssue('high',
              `Outdated Package: ${pkgName}`,
              `${pkgName} ${version} is outdated. Update to ${minVersion.replace('<', '')}+ for security fixes.`,
              path.join(dir, 'package.json')
            );
          }
        }
      }
    }
    
    checkPackage(backendPackage, BACKEND_DIR);
    checkPackage(frontendPackage, FRONTEND_DIR);
  } catch (err) {
    console.error('Error checking dependencies:', err.message);
  }
}

function checkCodeSecurity() {
  console.log('💻 Checking code for security issues...');
  
  // Check backend source files
  const backendSrc = path.join(BACKEND_DIR, 'src');
  if (fs.existsSync(backendSrc)) {
    const files = getAllFiles(backendSrc, ['.ts', '.js']);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      // Check for SQL injection risks
      lines.forEach((line, index) => {
        if (line.includes('prisma.$queryRaw') || line.includes('prisma.$executeRaw')) {
          if (!line.includes('?') && line.includes('${')) {
            addIssue('high',
              'Potential SQL Injection',
              'Raw SQL query with template literals may be vulnerable to SQL injection. Use parameterized queries.',
              file,
              index + 1
            );
          }
        }
      });
      
      // Check for hardcoded secrets
      if (content.includes('sk_live_') || content.includes('sk_test_') || 
          content.includes('whsec_') || content.includes('ghp_')) {
        addIssue('critical',
          'Hardcoded Secret',
          'API key or secret found in source code. Move to environment variables.',
          file
        );
      }
      
      // Check for missing input validation
      if (file.includes('routes/') && !file.includes('validation/')) {
        const routeName = path.basename(file);
        if (!content.includes('zod') && !content.includes('validate') && 
            (content.includes('req.body') || content.includes('req.params') || content.includes('req.query'))) {
          addIssue('medium',
            'Missing Input Validation',
            `Route ${routeName} appears to lack input validation. Consider adding Zod validation.`,
            file
          );
        }
      }
    }
  }
}

function checkSecurityHeaders() {
  console.log('🛡️  Checking security headers...');
  
  const indexFile = path.join(BACKEND_DIR, 'src/index.ts');
  if (fs.existsSync(indexFile)) {
    const content = fs.readFileSync(indexFile, 'utf8');
    
    // Check for Helmet configuration
    if (!content.includes('helmet({') && content.includes('app.use(helmet())')) {
      addIssue('medium',
        'Basic Helmet Configuration',
        'Helmet is used with default settings. Consider customizing CSP and other security headers.',
        indexFile
      );
    }
    
    // Check for CORS configuration
    if (content.includes('cors({')) {
      if (content.includes('*') || content.includes('true')) {
        addIssue('high',
          'Overly Permissive CORS',
          'CORS configuration allows all origins. Restrict to specific domains.',
          indexFile
        );
      }
    }
  }
}

function checkFileUploadSecurity() {
  console.log('📎 Checking file upload security...');
  
  const filesRoute = path.join(BACKEND_DIR, 'src/routes/files.ts');
  if (fs.existsSync(filesRoute)) {
    const content = fs.readFileSync(filesRoute, 'utf8');
    
    // Check for secure file upload implementation
    const hasSecureUpload = content.includes('secureUpload') || 
                           (content.includes('multer') && content.includes('fileFilter'));
    const hasValidation = content.includes('validateFileContent') || 
                         content.includes('sanitizeFilename');
    
    if (!hasSecureUpload || !hasValidation) {
      addIssue('high',
        'Insecure File Upload',
        'File upload route lacks proper validation. Implement file type, size, and content checks.',
        filesRoute
      );
    } else {
      // Check if secureUpload middleware is actually used
      if (!content.includes('secureUpload,')) {
        addIssue('medium',
          'File Upload Middleware Not Applied',
          'Secure upload middleware defined but not applied to route. Add secureUpload to route middleware.',
          filesRoute
        );
      }
    }
  }
}

function getAllFiles(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, extensions));
    } else {
      if (extensions.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  
  return results;
}

function printReport() {
  console.log('\n' + '='.repeat(80));
  console.log('🔒 VOXREACH SECURITY AUDIT REPORT');
  console.log('='.repeat(80));
  
  const severities = ['critical', 'high', 'medium', 'low', 'info'];
  let totalIssues = 0;
  
  for (const severity of severities) {
    const issues = ISSUES[severity];
    if (issues.length > 0) {
      console.log(`\n${severity.toUpperCase()} (${issues.length}):`);
      console.log('-'.repeat(80));
      
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.title}`);
        console.log(`   ${issue.description}`);
        if (issue.file) {
          console.log(`   File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        }
        console.log();
      });
      
      totalIssues += issues.length;
    }
  }
  
  console.log('='.repeat(80));
  console.log(`Total Issues Found: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('✅ No security issues found!');
  } else {
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('1. Fix all CRITICAL and HIGH issues immediately');
    console.log('2. Address MEDIUM issues in the next development cycle');
    console.log('3. Review LOW and INFO issues for potential improvements');
    console.log('4. Run this audit regularly as part of your CI/CD pipeline');
  }
}

// Run all checks
console.log('🚀 Starting VoxReach Security Audit...\n');

checkEnvFiles();
checkDependencies();
checkCodeSecurity();
checkSecurityHeaders();
checkFileUploadSecurity();

printReport();

// Exit with appropriate code
const hasCriticalOrHigh = ISSUES.critical.length > 0 || ISSUES.high.length > 0;
process.exit(hasCriticalOrHigh ? 1 : 0);