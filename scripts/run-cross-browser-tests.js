const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readline = require('readline');

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

// Configuration
const CONFIG = {
  // Test files to run
  testFiles: [
    '**/__tests__/SearchBar.test.js',
    '**/__tests__/SearchResults.test.js',
    '**/__tests__/SearchPage.test.js',
    '**/__tests__/SearchContext.test.js'
  ],
  
  // Browsers to test (from browserstack.conf.js)
  browsers: ['chrome', 'firefox', 'safari', 'edge'],
  
  // Mobile browsers
  mobileBrowsers: ['ios', 'android'],
  
  // Output directory for test results
  outputDir: path.join(__dirname, '../browserstack-results')
};

// Ensure output directory exists
async function ensureOutputDir() {
  if (!await exists(CONFIG.outputDir)) {
    await mkdir(CONFIG.outputDir, { recursive: true });
  }
}

// Run tests for a specific browser
function runTests(browser, isMobile = false) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(CONFIG.outputDir, `${browser}-${timestamp}.json`);
  
  console.log(`\n🚀 Starting tests for ${browser}${isMobile ? ' (mobile)' : ''}...`);
  
  const testFiles = CONFIG.testFiles.map(file => `"src/${file}"`).join(' ');
  const command = `BROWSER=${browser} IS_MOBILE=${isMobile} npx jest ${testFiles} --json --outputFile=${outputFile} --testEnvironment=jsdom`;
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Tests completed for ${browser}`);
    return { success: true, outputFile };
  } catch (error) {
    console.error(`❌ Tests failed for ${browser}:`, error.message);
    return { success: false, outputFile, error };
  }
}

// Parse test results
async function parseTestResults(resultsFile) {
  try {
    const data = await readFile(resultsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing test results:', error);
    return null;
  }
}

// Generate test report
async function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalBrowsers: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    },
    browsers: results.map(r => ({
      browser: r.browser,
      isMobile: r.isMobile,
      success: r.success,
      resultsFile: r.resultsFile
    }))
  };
  
  const reportFile = path.join(CONFIG.outputDir, 'test-report.json');
  await writeFile(reportFile, JSON.stringify(report, null, 2));
  
  return report;
}

// Main function
async function main() {
  console.log('🚀 Starting cross-browser testing...');
  
  try {
    // Ensure output directory exists
    await ensureOutputDir();
    
    // Run tests for each browser
    const results = [];
    
    // Test desktop browsers
    for (const browser of CONFIG.browsers) {
      const { success, outputFile } = await runTests(browser);
      results.push({
        browser,
        isMobile: false,
        success,
        resultsFile: outputFile
      });
    }
    
    // Test mobile browsers
    for (const browser of CONFIG.mobileBrowsers) {
      const { success, outputFile } = await runTests(browser, true);
      results.push({
        browser,
        isMobile: true,
        success,
        resultsFile: outputFile
      });
    }
    
    // Generate and save report
    const report = await generateReport(results);
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ ${report.summary.passed} browsers passed`);
    console.log(`❌ ${report.summary.failed} browsers failed`);
    
    // Exit with appropriate status code
    process.exit(report.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Error running cross-browser tests:', error);
    process.exit(1);
  }
}

// Run the main function
main();
