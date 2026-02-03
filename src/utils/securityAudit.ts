/**
 * Security Audit - Comprehensive security scanning and validation
 *
 * Provides:
 * - Dependency vulnerability scanning
 * - Code security checks
 * - Secret detection
 * - Best practices validation
 * - OWASP Top 10 compliance
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { glob } from 'glob';

const execFileAsync = promisify(execFile);

export interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'dependency' | 'code' | 'secret' | 'config' | 'owasp';
  title: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
  references?: string[];
}

export interface SecurityAuditResult {
  issues: SecurityIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  score: number; // 0-100 security score
  passed: boolean;
}

export interface AuditOptions {
  checkDependencies?: boolean;
  checkSecrets?: boolean;
  checkCodeQuality?: boolean;
  checkOWASP?: boolean;
  failOnLevel?: 'critical' | 'high' | 'medium' | 'low';
}

const DEFAULT_OPTIONS: AuditOptions = {
  checkDependencies: true,
  checkSecrets: true,
  checkCodeQuality: true,
  checkOWASP: true,
  failOnLevel: 'high',
};

/**
 * Security Auditor
 */
export class SecurityAuditor {
  private options: AuditOptions;

  constructor(options: AuditOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Run full security audit
   */
  async audit(cwd: string = process.cwd()): Promise<SecurityAuditResult> {
    const issues: SecurityIssue[] = [];

    // Check dependencies
    if (this.options.checkDependencies) {
      const depIssues = await this.auditDependencies(cwd);
      issues.push(...depIssues);
    }

    // Check for secrets
    if (this.options.checkSecrets) {
      const secretIssues = await this.auditSecrets(cwd);
      issues.push(...secretIssues);
    }

    // Check code quality
    if (this.options.checkCodeQuality) {
      const codeIssues = await this.auditCode(cwd);
      issues.push(...codeIssues);
    }

    // Check OWASP compliance
    if (this.options.checkOWASP) {
      const owaspIssues = await this.auditOWASP(cwd);
      issues.push(...owaspIssues);
    }

    // Calculate summary and score
    const summary = this.calculateSummary(issues);
    const score = this.calculateScore(summary);
    const passed = this.checkPassed(summary);

    return {
      issues,
      summary,
      score,
      passed,
    };
  }

  /**
   * Audit dependencies for vulnerabilities
   */
  private async auditDependencies(cwd: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Check for npm audit
    const packageJsonPath = path.join(cwd, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const { stdout } = await execFileAsync('npm', ['audit', '--json'], { cwd });

        const auditResult = JSON.parse(stdout);

        if (auditResult.vulnerabilities) {
          for (const [pkgName, vuln] of Object.entries(auditResult.vulnerabilities as any)) {
            const v = vuln as any;
            issues.push({
              id: `dep-${pkgName}-${v.name}`,
              severity: this.mapSeverity(v.severity),
              category: 'dependency',
              title: `Vulnerability in ${pkgName}`,
              description: v.name,
              recommendation: `Upgrade ${pkgName} to a patched version`,
              references: [`https://github.com/advisories/${v.name}`],
            });
          }
        }
      } catch {
        // npm audit failed or not available
      }
    }

    // Check for outdated packages
    if (existsSync(packageJsonPath)) {
      try {
        const { stdout } = await execFileAsync('npm', ['outdated', '--json'], { cwd });

        const outdatedResult = JSON.parse(stdout);

        for (const [pkgName, info] of Object.entries(outdatedResult)) {
          const pkg = info as any;
          if (pkg.security) {
            issues.push({
              id: `outdated-${pkgName}`,
              severity: 'medium',
              category: 'dependency',
              title: `Outdated package with security fixes: ${pkgName}`,
              description: `Current: ${pkg.current}, Latest: ${pkg.latest}`,
              recommendation: `Run: npm update ${pkgName}`,
            });
          }
        }
      } catch {
        // npm outdated failed
      }
    }

    return issues;
  }

  /**
   * Audit code for secrets and sensitive data
   */
  private async auditSecrets(cwd: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Secret patterns to detect
    const secretPatterns = [
      {
        pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"]([^'"\s]{8,})['"]/gi,
        name: 'Hardcoded password',
        severity: 'critical' as const,
      },
      {
        pattern: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"]([^'"\s]{20,})['"]/gi,
        name: 'Hardcoded API key',
        severity: 'critical' as const,
      },
      {
        pattern: /(?:token|auth[_-]?token|access[_-]?token)\s*[:=]\s*['"]([^'"\s]{20,})['"]/gi,
        name: 'Hardcoded token',
        severity: 'critical' as const,
      },
      {
        pattern: /sk-[a-zA-Z0-9]{48}/g, // Stripe
        name: 'Stripe API key',
        severity: 'critical' as const,
      },
      {
        pattern: /AKIA[0-9A-Z]{16}/g, // AWS
        name: 'AWS access key',
        severity: 'critical' as const,
      },
      {
        pattern: /xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32}/g, // Slack
        name: 'Slack token',
        severity: 'critical' as const,
      },
      {
        pattern: /ghp_[a-zA-Z0-9]{36}/g, // GitHub
        name: 'GitHub personal access token',
        severity: 'critical' as const,
      },
      {
        pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\s*:\s*[^'"\s]{8,}/g, // email:password
        name: 'Credentials in URL',
        severity: 'critical' as const,
      },
    ];

    // Files to scan
    const extensions = ['.js', '.ts', '.jsx', '.tsx', '.json', '.env', '.yaml', '.yml'];
    const ignorePatterns = ['node_modules/**', 'dist/**', '.git/**', 'coverage/**'];

    for (const ext of extensions) {
      const files = glob.sync(`**/*${ext}`, { cwd, ignore: ignorePatterns, absolute: false });

      for (const file of files) {
        const filePath = path.join(cwd, file);
        try {
          const content = readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];

            for (const { pattern, name, severity } of secretPatterns) {
              const matches = line.matchAll(pattern);

              for (const match of matches) {
                // Skip if it's a comment or example
                if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.includes('example')) {
                  continue;
                }

                issues.push({
                  id: `secret-${file}-${lineNum}`,
                  severity,
                  category: 'secret',
                  title: name,
                  description: `Potential secret detected in ${file}:${lineNum + 1}`,
                  file: file,
                  line: lineNum + 1,
                  recommendation: 'Remove the secret and use environment variables or a secrets manager',
                });
              }
            }
          }
        } catch {
          // Skip files that can't be read
        }
      }
    }

    return issues;
  }

  /**
   * Audit code for security issues
   */
  private async auditCode(cwd: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Code security patterns
    const codePatterns = [
      {
        pattern: /eval\s*\(/gi,
        name: 'Use of eval()',
        severity: 'high' as const,
        recommendation: 'Avoid eval() - use JSON.parse() or alternative safer methods',
      },
      {
        pattern: /innerHTML\s*=/gi,
        name: 'Direct innerHTML assignment',
        severity: 'medium' as const,
        recommendation: 'Use textContent or sanitize HTML before assignment',
      },
      {
        pattern: /dangerouslySetInnerHTML/gi,
        name: 'Use of dangerouslySetInnerHTML',
        severity: 'medium' as const,
        recommendation: 'Sanitize HTML or use safer alternatives',
      },
      {
        pattern: /document\.write\s*\(/gi,
        name: 'Use of document.write()',
        severity: 'medium' as const,
        recommendation: 'Use DOM manipulation methods instead',
      },
      {
        pattern: /setTimeout\s*\(\s*['"]/gi,
        name: 'setTimeout with string argument',
        severity: 'medium' as const,
        recommendation: 'Pass a function instead of a string',
      },
      {
        pattern: /Math\.random\s*\(\)/gi,
        name: 'Math.random() for security-sensitive operations',
        severity: 'low' as const,
        recommendation: 'Use crypto.randomBytes() or crypto.getRandomValues() for cryptographic randomness',
      },
    ];

    const extensions = ['.js', '.ts', '.jsx', '.tsx'];
    const ignorePatterns = ['node_modules/**', 'dist/**', '.git/**', 'coverage/**'];

    for (const ext of extensions) {
      const files = glob.sync(`**/*${ext}`, { cwd, ignore: ignorePatterns, absolute: false });

      for (const file of files) {
        const filePath = path.join(cwd, file);
        try {
          const content = readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];

            for (const { pattern, name, severity, recommendation } of codePatterns) {
              if (pattern.test(line)) {
                issues.push({
                  id: `code-${file}-${lineNum}`,
                  severity,
                  category: 'code',
                  title: name,
                  description: `Security issue detected in ${file}:${lineNum + 1}`,
                  file: file,
                  line: lineNum + 1,
                  recommendation,
                });
              }
            }
          }
        } catch {
          // Skip files that can't be read
        }
      }
    }

    return issues;
  }

  /**
   * Audit OWASP Top 10 compliance
   */
  private async auditOWASP(cwd: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // A01: Broken Access Control
    const hasCorsConfig = existsSync(path.join(cwd, '**/*cors*'));
    if (!hasCorsConfig) {
      issues.push({
        id: 'owasp-a01-cors',
        severity: 'medium',
        category: 'owasp',
        title: 'CORS configuration not found',
        description: 'No CORS configuration detected',
        recommendation: 'Configure CORS properly to restrict cross-origin requests',
      });
    }

    // A02: Cryptographic Failures
    const hasHttpsInEnv = existsSync(path.join(cwd, '.env')) || existsSync(path.join(cwd, '.env.example'));
    if (hasHttpsInEnv) {
      try {
        const envContent = readFileSync(path.join(cwd, '.env'), 'utf-8');
        if (!envContent.includes('HTTPS') && !envContent.includes('SSL')) {
          issues.push({
            id: 'owasp-a02-https',
            severity: 'medium',
            category: 'owasp',
            title: 'HTTPS not enforced',
            description: 'No HTTPS configuration found in environment variables',
            recommendation: 'Add HTTPS=true or similar configuration',
          });
        }
      } catch {
        // Can't read env file
      }
    }

    // A03: Injection
    const packageJsonPath = path.join(cwd, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check for SQL libraries
      const sqlLibs = ['mysql', 'mysql2', 'pg', 'sqlite3', 'mongoose', 'sequelize'];
      const hasSQL = sqlLibs.some(lib => deps[lib]);
      const hasORM = deps['prisma'] || deps['typeorm'];

      if (hasSQL && !hasORM) {
        issues.push({
          id: 'owasp-a03-sql',
          severity: 'high',
          category: 'owasp',
          title: 'SQL library without ORM detected',
          description: 'Direct SQL libraries should use parameterized queries or ORM',
          recommendation: 'Use an ORM or ensure all queries use parameterized statements',
        });
      }

      // Check for input validation libraries
      const hasValidation = deps['joi'] || deps['zod'] || deps['yup'] || deps['validator'];
      if (!hasValidation) {
        issues.push({
          id: 'owasp-a03-validation',
          severity: 'medium',
          category: 'owasp',
          title: 'No input validation library found',
          description: 'Consider adding input validation to prevent injection attacks',
          recommendation: 'Add joi, zod, yup, or validator for input validation',
        });
      }
    }

    // A05: Security Misconfiguration
    const hasESLintConfig = existsSync(path.join(cwd, '.eslintrc*')) || existsSync(path.join(cwd, 'eslint.config.*'));
    if (!hasESLintConfig) {
      issues.push({
        id: 'owasp-a05-eslint',
        severity: 'low',
        category: 'owasp',
        title: 'ESLint configuration not found',
        description: 'ESLint helps catch security issues',
        recommendation: 'Add ESLint with security plugins',
      });
    }

    // A07: Identification and Authentication Failures
    const hasAuthLib = existsSync(packageJsonPath);
    if (hasAuthLib) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      const hasAuth = deps['bcrypt'] || deps['bcryptjs'] || deps['argon2'] || deps['jsonwebtoken'];
      const hasPassport = deps['passport'];

      if (hasPassport && !hasAuth) {
        issues.push({
          id: 'owasp-a07-password',
          severity: 'high',
          category: 'owasp',
          title: 'Passport.js without password hashing library',
          description: 'Ensure passwords are properly hashed',
          recommendation: 'Add bcrypt, bcryptjs, or argon2 for password hashing',
        });
      }
    }

    return issues;
  }

  /**
   * Calculate issue summary
   */
  private calculateSummary(issues: SecurityIssue[]): SecurityAuditResult['summary'] {
    return {
      critical: issues.filter(i => i.severity === 'critical').length,
      high: issues.filter(i => i.severity === 'high').length,
      medium: issues.filter(i => i.severity === 'medium').length,
      low: issues.filter(i => i.severity === 'low').length,
      info: issues.filter(i => i.severity === 'info').length,
    };
  }

  /**
   * Calculate security score (0-100)
   */
  private calculateScore(summary: SecurityAuditResult['summary']): number {
    const weights = { critical: 25, high: 15, medium: 5, low: 1, info: 0 };
    const deductions =
      summary.critical * weights.critical +
      summary.high * weights.high +
      summary.medium * weights.medium +
      summary.low * weights.low;

    return Math.max(0, 100 - deductions);
  }

  /**
   * Check if audit passed
   */
  private checkPassed(summary: SecurityAuditResult['summary']): boolean {
    const failLevel = this.options.failOnLevel || 'high';

    switch (failLevel) {
      case 'critical':
        return summary.critical === 0;
      case 'high':
        return summary.critical === 0 && summary.high === 0;
      case 'medium':
        return summary.critical === 0 && summary.high === 0 && summary.medium === 0;
      case 'low':
        return (
          summary.critical === 0 &&
          summary.high === 0 &&
          summary.medium === 0 &&
          summary.low === 0
        );
      default:
        return true;
    }
  }

  /**
   * Map npm audit severity to our severity
   */
  private mapSeverity(severity: string): SecurityIssue['severity'] {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'moderate':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'info';
    }
  }

  /**
   * Format audit result as markdown
   */
  formatAsMarkdown(result: SecurityAuditResult): string {
    const lines: string[] = [];

    lines.push('# Security Audit Report');
    lines.push('');
    lines.push(`## Summary`);
    lines.push('');
    lines.push(`**Security Score:** ${result.score}/100`);
    lines.push(`**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push('');
    lines.push('| Severity | Count |');
    lines.push('|----------|-------|');
    lines.push(`| Critical | ${result.summary.critical} |`);
    lines.push(`| High | ${result.summary.high} |`);
    lines.push(`| Medium | ${result.summary.medium} |`);
    lines.push(`| Low | ${result.summary.low} |`);
    lines.push(`| Info | ${result.summary.info} |`);
    lines.push('');

    if (result.issues.length > 0) {
      lines.push('## Issues Found');
      lines.push('');

      for (const issue of result.issues) {
        const emoji = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢',
          info: '🔵',
        }[issue.severity];

        lines.push(`### ${emoji} ${issue.title}`);
        lines.push('');
        lines.push(`**Severity:** ${issue.severity.toUpperCase()}`);
        lines.push(`**Category:** ${issue.category}`);

        if (issue.file) {
          lines.push(`**Location:** ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        }

        lines.push('');
        lines.push(issue.description);
        lines.push('');
        lines.push(`**Recommendation:** ${issue.recommendation}`);

        if (issue.references && issue.references.length > 0) {
          lines.push('');
          lines.push('**References:**');
          for (const ref of issue.references) {
            lines.push(`- ${ref}`);
          }
        }

        lines.push('');
      }
    } else {
      lines.push('## ✅ No Issues Found');
      lines.push('');
      lines.push('Great job! No security issues were detected.');
    }

    lines.push('');
    lines.push('---');
    lines.push('_Generated by Orchestra Security Auditor_');

    return lines.join('\n');
  }
}

/**
 * Run security audit
 */
export async function runSecurityAudit(
  options: AuditOptions = {},
  cwd: string = process.cwd()
): Promise<SecurityAuditResult> {
  const auditor = new SecurityAuditor(options);
  return await auditor.audit(cwd);
}

/**
 * Run security audit and fail on issues
 */
export async function securityAuditCheck(
  options: AuditOptions = {},
  cwd: string = process.cwd()
): Promise<void> {
  const result = await runSecurityAudit(options, cwd);

  console.log(`Security Score: ${result.score}/100`);
  console.log(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`);

  if (!result.passed) {
    throw new Error(
      `Security audit failed with ${result.summary.critical} critical, ${result.summary.high} high, ${result.summary.medium} medium issues`
    );
  }
}
