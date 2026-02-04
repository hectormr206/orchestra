#!/usr/bin/env node

/**
 * Code Metrics Analyzer
 *
 * Measures code quality metrics for Orchestra
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SOURCE_DIR = 'src';

// Collect all TypeScript files
function getTsFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'web') {
      files.push(...getTsFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Analyze file
function analyzeFile(content) {
  const lines = content.split('\n');
  let complexity = 0;
  let functions = 0;

  for (const line of lines) {
    // Complexity indicators
    if (line.includes('if ') || line.includes('else if') || line.includes('for ') ||
        line.includes('while ') || line.includes('case ') || line.includes('catch ') ||
        line.includes('&&') || line.includes('||')) {
      complexity++;
    }

    // Function definitions
    if (line.includes('function ') || line.match(/const\s+\w+\s*=\s*\(/) ||
        line.match(/\(\s*\)\s*=>/) || line.includes('async ')) {
      functions++;
    }
  }

  return { complexity, functions, lines: lines.length };
}

// Check for duplicate imports
function checkDuplicates(content) {
  const lines = content.split('\n');
  const imports = [];
  let duplicates = 0;

  for (const line of lines) {
    if (line.trim().startsWith('import ')) {
      imports.push(line.trim());
    }
  }

  const unique = new Set(imports);
  duplicates = imports.length - unique.size;

  return { total: imports.length, duplicates };
}

// Main analysis
function analyze() {
  console.log('📊 Orchestra Code Metrics Analysis');
  console.log('====================================\n');

  const files = getTsFiles(SOURCE_DIR);
  const totalFiles = files.length;

  let totalComplexity = 0;
  let totalFunctions = 0;
  let totalLines = 0;
  let totalImports = 0;
  let duplicateImports = 0;

  console.log(`Analyzing ${totalFiles} TypeScript files...\n`);

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const { complexity, functions, lines } = analyzeFile(content);
      const { total: imports, duplicates } = checkDuplicates(content);

      totalComplexity += complexity;
      totalFunctions += functions;
      totalLines += lines;
      totalImports += imports;
      duplicateImports += duplicates;
    } catch (e) {
      // Skip files that can't be read
    }
  }

  const avgComplexity = totalFunctions > 0 ? (totalComplexity / totalFunctions).toFixed(1) : 0;
  const avgLinesPerFile = (totalLines / totalFiles).toFixed(0);
  const duplicationRate = totalImports > 0 ? ((duplicateImports / totalImports) * 100).toFixed(1) : 0;

  // Results
  console.log('📈 RESULTS\n');
  console.log(`📁 Total Files: ${totalFiles}`);
  console.log(`📄 Total Lines: ${totalLines}`);
  console.log(`📊 Avg Lines/File: ${avgLinesPerFile}`);
  console.log(`🔧 Total Functions: ${totalFunctions}`);
  console.log(`📉 Total Complexity: ${totalComplexity}`);
  console.log(`🎯 Avg Complexity/Function: ${avgComplexity}`);
  console.log(`📦 Total Imports: ${totalImports}`);
  console.log(`🔁 Duplicate Imports: ${duplicateImports}`);
  console.log(`📊 Duplication Rate: ${duplicationRate}%`);

  console.log('\n✅ METRIC COMPLIANCE\n');

  const complexityPass = parseFloat(avgComplexity) < 15;
  const duplicationPass = parseFloat(duplicationRate) < 5;

  console.log(`Complexity < 15:           ${complexityPass ? '✓ PASS' : '✗ FAIL'} (${avgComplexity})`);
  console.log(`Duplication < 5%:          ${duplicationPass ? '✓ PASS' : '✗ FAIL'} (${duplicationRate}%)`);

  console.log(`\nOverall: ${complexityPass && duplicationPass ? '✓ ALL CHECKS PASSED' : '✗ SOME CHECKS FAILED'}`);

  return {
    totalFiles,
    totalLines,
    totalFunctions,
    avgComplexity,
    duplicationRate,
    passed: complexityPass && duplicationPass,
  };
}

analyze();
