/**
 * Framework Detector - Automatic detection of frameworks and project types
 *
 * Supports detection of:
 * - Frontend frameworks (React, Vue, Angular, Svelte, etc.)
 * - Backend frameworks (Express, Fastify, NestJS, etc.)
 * - Test frameworks (Jest, Vitest, Pytest, etc.)
 * - Build tools (Vite, Webpack, esbuild, etc.)
 * - Package managers (npm, yarn, pnpm, bun)
 * - Languages (TypeScript, JavaScript, Python, Go, Rust, etc.)
 */

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface OrchestrationRecommendations {
  agentPreference: string[];
  maxConcurrency: number;
  useCache: boolean;
  testCommand?: string;
  buildCommand?: string;
  lintCommand?: string;
  customPrompts?: Record<string, string>;
}

export interface FrameworkInfo {
  name: string;
  type: 'frontend' | 'backend' | 'mobile' | 'desktop' | 'test' | 'build' | 'language';
  version?: string;
  configFiles: string[];
  dependencies: string[];
}

export interface ProjectDetection {
  frameworks: FrameworkInfo[];
  language: string;
  packageManager: string;
  hasTypeScript: boolean;
  hasTests: boolean;
  testFramework?: string;
  buildTool?: string;
  monorepo: boolean;
  monorepoType?: 'nx' | 'turborepo' | 'lerna' | 'pnpm-workspace' | 'yarn-workspace' | undefined;
  recommendations: OrchestrationRecommendations;
}

/**
 * Framework detection patterns
 */
const FRAMEWORK_PATTERNS: Record<string, {
  type: FrameworkInfo['type'];
  configFiles: string[];
  dependencies: string[];
  devDependencies?: string[];
}> = {
  // Frontend frameworks
  react: {
    type: 'frontend',
    configFiles: ['**/jsx', '**/tsx', '**/*.jsx', '**/*.tsx'],
    dependencies: ['react', 'react-dom'],
    devDependencies: ['@types/react', '@types/react-dom'],
  },
  vue: {
    type: 'frontend',
    configFiles: ['vue.config.js', 'vite.config.vue.ts', '**/*.vue'],
    dependencies: ['vue'],
    devDependencies: ['@vitejs/plugin-vue', 'vue-loader'],
  },
  angular: {
    type: 'frontend',
    configFiles: ['angular.json', 'nx.json'],
    dependencies: ['@angular/core', '@angular/common'],
    devDependencies: ['@angular/cli', '@angular/compiler-cli'],
  },
  svelte: {
    type: 'frontend',
    configFiles: ['svelte.config.js', '**/*.svelte'],
    dependencies: ['svelte'],
    devDependencies: ['svelte-preprocess'],
  },
  solid: {
    type: 'frontend',
    configFiles: ['**/*.jsx', '**/*.tsx'],
    dependencies: ['solid-js'],
    devDependencies: ['vite-plugin-solid'],
  },
  preact: {
    type: 'frontend',
    configFiles: ['preact.config.js'],
    dependencies: ['preact'],
    devDependencies: ['@preact/preset-vite'],
  },

  // Backend frameworks
  express: {
    type: 'backend',
    configFiles: [],
    dependencies: ['express'],
    devDependencies: ['@types/express'],
  },
  fastify: {
    type: 'backend',
    configFiles: [],
    dependencies: ['fastify'],
    devDependencies: [],
  },
  nestjs: {
    type: 'backend',
    configFiles: ['nest-cli.json'],
    dependencies: ['@nestjs/core', '@nestjs/common'],
    devDependencies: ['@nestjs/cli'],
  },
  koa: {
    type: 'backend',
    configFiles: [],
    dependencies: ['koa'],
    devDependencies: ['@types/koa'],
  },
  hapi: {
    type: 'backend',
    configFiles: [],
    dependencies: ['@hapi/hapi'],
    devDependencies: [],
  },

  // Mobile frameworks
  reactNative: {
    type: 'mobile',
    configFiles: ['app.json', 'react-native.config.js'],
    dependencies: ['react-native'],
    devDependencies: [],
  },
  ionic: {
    type: 'mobile',
    configFiles: ['ionic.config.json'],
    dependencies: ['@ionic/react', '@ionic/angular'],
    devDependencies: [],
  },

  // Desktop frameworks
  electron: {
    type: 'desktop',
    configFiles: ['electron-builder.json', 'electron-builder.yml'],
    dependencies: ['electron'],
    devDependencies: [],
  },
  tauri: {
    type: 'desktop',
    configFiles: ['tauri.conf.json', 'tauri.config.json'],
    dependencies: ['@tauri-apps/api'],
    devDependencies: ['@tauri-apps/cli'],
  },

  // Test frameworks
  jest: {
    type: 'test',
    configFiles: ['jest.config.js', 'jest.config.ts', 'jest.config.json'],
    dependencies: ['jest'],
    devDependencies: ['@types/jest', 'ts-jest'],
  },
  vitest: {
    type: 'test',
    configFiles: ['vitest.config.ts', 'vitest.config.js'],
    dependencies: ['vitest'],
    devDependencies: ['@vitest/ui'],
  },
  mocha: {
    type: 'test',
    configFiles: ['.mocharc.js', '.mocharc.json'],
    dependencies: ['mocha'],
    devDependencies: ['@types/mocha'],
  },
  jasmine: {
    type: 'test',
    configFiles: [],
    dependencies: ['jasmine'],
    devDependencies: ['@types/jasmine'],
  },
  cypress: {
    type: 'test',
    configFiles: ['cypress.config.js', 'cypress.config.ts'],
    dependencies: ['cypress'],
    devDependencies: [],
  },
  playwright: {
    type: 'test',
    configFiles: ['playwright.config.js', 'playwright.config.ts'],
    dependencies: ['@playwright/test'],
    devDependencies: [],
  },

  // Build tools
  vite: {
    type: 'build',
    configFiles: ['vite.config.js', 'vite.config.ts'],
    dependencies: ['vite'],
    devDependencies: [],
  },
  webpack: {
    type: 'build',
    configFiles: ['webpack.config.js', 'webpack.config.ts'],
    dependencies: ['webpack'],
    devDependencies: ['webpack-cli', 'webpack-dev-server'],
  },
  rollup: {
    type: 'build',
    configFiles: ['rollup.config.js', 'rollup.config.ts'],
    dependencies: ['rollup'],
    devDependencies: ['@rollup/plugin-typescript'],
  },
  esbuild: {
    type: 'build',
    configFiles: ['esbuild.config.js', 'esbuild.config.ts'],
    dependencies: ['esbuild'],
    devDependencies: [],
  },
  parcel: {
    type: 'build',
    configFiles: ['.parcelrc'],
    dependencies: ['parcel'],
    devDependencies: [],
  },
  next: {
    type: 'build',
    configFiles: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
    dependencies: ['next'],
    devDependencies: [],
  },
  nuxt: {
    type: 'build',
    configFiles: ['nuxt.config.js', 'nuxt.config.ts'],
    dependencies: ['nuxt'],
    devDependencies: [],
  },
  astro: {
    type: 'build',
    configFiles: ['astro.config.js', 'astro.config.ts', 'astro.config.mjs'],
    dependencies: ['astro'],
    devDependencies: [],
  },
  remix: {
    type: 'build',
    configFiles: [],
    dependencies: ['@remix-run/node', '@remix-run/react'],
    devDependencies: ['@remix-run/dev'],
  },

  // Languages
  typescript: {
    type: 'language',
    configFiles: ['tsconfig.json', 'tsconfig.base.json'],
    dependencies: ['typescript'],
    devDependencies: [],
  },
  python: {
    type: 'language',
    configFiles: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'],
    dependencies: [],
    devDependencies: [],
  },
  go: {
    type: 'language',
    configFiles: ['go.mod'],
    dependencies: [],
    devDependencies: [],
  },
  rust: {
    type: 'language',
    configFiles: ['Cargo.toml', 'Cargo.lock'],
    dependencies: [],
    devDependencies: [],
  },
};

/**
 * Detect framework from package.json dependencies
 */
function detectFromPackageJson(cwd: string): FrameworkInfo[] {
  const frameworks: FrameworkInfo[] = [];

  const packageJsonPath = path.join(cwd, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return frameworks;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    for (const [name, pattern] of Object.entries(FRAMEWORK_PATTERNS)) {
      const deps = pattern.dependencies || [];
      const devDeps = pattern.devDependencies || [];
      const allPatternDeps = [...deps, ...devDeps];

      const hasFramework = allPatternDeps.some(dep =>
        Object.keys(allDeps).some(key => key === dep || key.startsWith(dep + '/'))
      );

      if (hasFramework) {
        frameworks.push({
          name,
          type: pattern.type,
          version: allDeps[name] || allDeps[`@${name}`] || undefined,
          configFiles: [],
          dependencies: allPatternDeps.filter(dep => allDeps[dep]),
        });
      }
    }
  } catch {
    // Invalid package.json
  }

  return frameworks;
}

/**
 * Detect framework from config files
 */
function detectFromConfigFiles(cwd: string): FrameworkInfo[] {
  const frameworks: FrameworkInfo[] = [];

  for (const [name, pattern] of Object.entries(FRAMEWORK_PATTERNS)) {
    for (const configFile of pattern.configFiles) {
      const matches = glob.sync(configFile, { cwd, absolute: false });
      if (matches.length > 0) {
        frameworks.push({
          name,
          type: pattern.type,
          configFiles: matches,
          dependencies: pattern.dependencies || [],
        });
        break;
      }
    }
  }

  return frameworks;
}

/**
 * Detect language from files
 */
function detectLanguage(cwd: string): string {
  // Check for Python
  if (existsSync(path.join(cwd, 'requirements.txt')) ||
      existsSync(path.join(cwd, 'pyproject.toml')) ||
      existsSync(path.join(cwd, 'setup.py')) ||
      existsSync(path.join(cwd, 'Pipfile'))) {
    return 'python';
  }

  // Check for Go
  if (existsSync(path.join(cwd, 'go.mod'))) {
    return 'go';
  }

  // Check for Rust
  if (existsSync(path.join(cwd, 'Cargo.toml'))) {
    return 'rust';
  }

  // Check for Java/Kotlin
  if (existsSync(path.join(cwd, 'pom.xml')) ||
      existsSync(path.join(cwd, 'build.gradle')) ||
      existsSync(path.join(cwd, 'build.gradle.kts'))) {
    return 'java';
  }

  // Check for Ruby
  if (existsSync(path.join(cwd, 'Gemfile'))) {
    return 'ruby';
  }

  // Check for PHP
  if (existsSync(path.join(cwd, 'composer.json'))) {
    return 'php';
  }

  // Default to JavaScript/TypeScript for Node.js projects
  if (existsSync(path.join(cwd, 'package.json'))) {
    return existsSync(path.join(cwd, 'tsconfig.json')) ? 'typescript' : 'javascript';
  }

  return 'unknown';
}

/**
 * Detect package manager
 */
function detectPackageManager(cwd: string): string {
  if (existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (existsSync(path.join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  if (existsSync(path.join(cwd, 'bun.lockb'))) {
    return 'bun';
  }
  if (existsSync(path.join(cwd, 'package-lock.json'))) {
    return 'npm';
  }
  return 'npm'; // Default
}

/**
 * Detect monorepo
 */
function detectMonorepo(cwd: string): { monorepo: boolean; type?: ProjectDetection['monorepoType'] } {
  // Check for Nx
  if (existsSync(path.join(cwd, 'nx.json'))) {
    return { monorepo: true, type: 'nx' };
  }

  // Check for Turborepo
  if (existsSync(path.join(cwd, 'turbo.json'))) {
    return { monorepo: true, type: 'turborepo' };
  }

  // Check for Lerna
  if (existsSync(path.join(cwd, 'lerna.json'))) {
    return { monorepo: true, type: 'lerna' };
  }

  // Check for pnpm workspace
  if (existsSync(path.join(cwd, 'pnpm-workspace.yaml'))) {
    return { monorepo: true, type: 'pnpm-workspace' };
  }

  // Check for Yarn workspace
  const packageJsonPath = path.join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.workspaces) {
        return { monorepo: true, type: 'yarn-workspace' };
      }
    } catch {
      // Invalid package.json
    }
  }

  return { monorepo: false };
}

/**
 * Detect test framework
 */
function detectTestFramework(frameworks: FrameworkInfo[]): string | undefined {
  const testFrameworks = frameworks.filter(f => f.type === 'test');
  if (testFrameworks.length > 0) {
    return testFrameworks[0].name;
  }
  return undefined;
}

/**
 * Detect build tool
 */
function detectBuildTool(frameworks: FrameworkInfo[]): string | undefined {
  const buildTools = frameworks.filter(f => f.type === 'build');
  if (buildTools.length > 0) {
    return buildTools[0].name;
  }
  return undefined;
}

/**
 * Main detection function
 */
export function detectProject(cwd: string = process.cwd()): ProjectDetection {
  const frameworksFromDeps = detectFromPackageJson(cwd);
  const frameworksFromConfig = detectFromConfigFiles(cwd);

  // Merge and deduplicate frameworks
  const frameworkMap = new Map<string, FrameworkInfo>();
  for (const fw of [...frameworksFromDeps, ...frameworksFromConfig]) {
    if (!frameworkMap.has(fw.name)) {
      frameworkMap.set(fw.name, fw);
    } else {
      // Merge info if already exists
      const existing = frameworkMap.get(fw.name)!;
      if (fw.version) existing.version = fw.version;
      if (fw.configFiles.length > 0) {
        existing.configFiles = [...new Set([...existing.configFiles, ...fw.configFiles])];
      }
    }
  }

  const frameworks = Array.from(frameworkMap.values());
  const language = detectLanguage(cwd);
  const packageManager = detectPackageManager(cwd);
  const hasTypeScript = existsSync(path.join(cwd, 'tsconfig.json'));
  const hasTests = frameworks.some(f => f.type === 'test');
  const testFramework = detectTestFramework(frameworks);
  const buildTool = detectBuildTool(frameworks);
  const monorepoInfo = detectMonorepo(cwd);

  return {
    frameworks,
    language,
    packageManager,
    hasTypeScript,
    hasTests,
    testFramework,
    buildTool: buildTool || 'unknown',
    monorepo: monorepoInfo.monorepo,
    monorepoType: monorepoInfo.type,
    recommendations: generateRecommendations(language, packageManager, frameworks),
  };
}

/**
 * Generate orchestration recommendations
 */
function generateRecommendations(
  language: string,
  packageManager: string,
  frameworks: FrameworkInfo[]
): OrchestrationRecommendations {
  return {
    agentPreference: ['Claude (Opus 4.5)', 'Gemini', 'Claude (GLM 4.7)'],
    maxConcurrency: 3,
    useCache: true,
    testCommand: getTestCommandForLanguage(language, packageManager),
    buildCommand: getBuildCommandForLanguage(language, packageManager),
    lintCommand: getLintCommandForLanguage(language, packageManager),
  };
}

/**
 * Get recommended test command based on detected framework
 */
export function getTestCommand(detection: ProjectDetection): string {
  if (detection.testFramework === 'jest') {
    return detection.hasTypeScript ? 'npm test -- --passWithNoTests' : 'npm test -- --passWithNoTests';
  }
  if (detection.testFramework === 'vitest') {
    return 'npm test';
  }
  if (detection.testFramework === 'mocha') {
    return 'npm test';
  }
  if (detection.testFramework === 'cypress') {
    return 'npm run cypress:run || npx cypress run';
  }
  if (detection.testFramework === 'playwright') {
    return 'npm run playwright:test || npx playwright test';
  }

  // Language-specific defaults
  if (detection.language === 'python') {
    return 'pytest || python -m pytest';
  }
  if (detection.language === 'go') {
    return 'go test ./...';
  }
  if (detection.language === 'rust') {
    return 'cargo test';
  }

  return 'npm test';
}

/**
 * Get recommended build command based on detected framework
 */
export function getBuildCommand(detection: ProjectDetection): string | undefined {
  if (detection.buildTool === 'vite') {
    return 'npm run build';
  }
  if (detection.buildTool === 'webpack') {
    return 'npm run build';
  }
  if (detection.buildTool === 'next') {
    return 'npm run build';
  }
  if (detection.buildTool === 'nuxt') {
    return 'npm run build';
  }
  if (detection.buildTool === 'astro') {
    return 'npm run build';
  }
  if (detection.buildTool === 'remix') {
    return 'npm run build';
  }

  // Language-specific defaults
  if (detection.language === 'python') {
    return undefined; // Python typically doesn't have build commands
  }
  if (detection.language === 'go') {
    return 'go build ./...';
  }
  if (detection.language === 'rust') {
    return 'cargo build --release';
  }

  return undefined;
}

/**
 * Get recommended lint command based on detected framework
 */
export function getLintCommand(detection: ProjectDetection): string | undefined {
  // Node.js/JavaScript/TypeScript
  if (detection.language === 'typescript' || detection.language === 'javascript') {
    if (detection.packageManager === 'npm') {
      return 'npm run lint || npm run eslint';
    }
    if (detection.packageManager === 'yarn') {
      return 'yarn lint || yarn eslint';
    }
    if (detection.packageManager === 'pnpm') {
      return 'pnpm lint || pnpm eslint';
    }
    if (detection.packageManager === 'bun') {
      return 'bun run lint || bun run eslint';
    }
  }

  // Python
  if (detection.language === 'python') {
    return 'flake8 . || pylint . || ruff check .';
  }

  // Go
  if (detection.language === 'go') {
    return 'go fmt ./... && go vet ./...';
  }

  // Rust
  if (detection.language === 'rust') {
    return 'cargo clippy -- -D warnings';
  }

  return undefined;
}

/**
 * Get recommended test command based on language and package manager
 */
function getTestCommandForLanguage(language: string, packageManager: string): string | undefined {
  if (language === 'python') {
    return 'pytest || python -m pytest';
  }
  if (language === 'go') {
    return 'go test ./...';
  }
  if (language === 'rust') {
    return 'cargo test';
  }
  if (language === 'typescript' || language === 'javascript') {
    if (packageManager === 'npm') {
      return 'npm test';
    }
    if (packageManager === 'yarn') {
      return 'yarn test';
    }
    if (packageManager === 'pnpm') {
      return 'pnpm test';
    }
    if (packageManager === 'bun') {
      return 'bun test';
    }
  }
  return undefined;
}

/**
 * Get recommended build command based on language and package manager
 */
function getBuildCommandForLanguage(language: string, packageManager: string): string | undefined {
  if (language === 'python') {
    return undefined; // Python typically doesn't have build commands
  }
  if (language === 'go') {
    return 'go build ./...';
  }
  if (language === 'rust') {
    return 'cargo build --release';
  }
  if (language === 'typescript' || language === 'javascript') {
    if (packageManager === 'npm') {
      return 'npm run build';
    }
    if (packageManager === 'yarn') {
      return 'yarn build';
    }
    if (packageManager === 'pnpm') {
      return 'pnpm build';
    }
    if (packageManager === 'bun') {
      return 'bun run build';
    }
  }
  return undefined;
}

/**
 * Get recommended lint command based on language and package manager
 */
function getLintCommandForLanguage(language: string, packageManager: string): string | undefined {
  if (language === 'python') {
    return 'flake8 . || pylint . || ruff check .';
  }
  if (language === 'go') {
    return 'go fmt ./... && go vet ./...';
  }
  if (language === 'rust') {
    return 'cargo clippy -- -D warnings';
  }
  if (language === 'typescript' || language === 'javascript') {
    if (packageManager === 'npm') {
      return 'npm run lint || npm run eslint';
    }
    if (packageManager === 'yarn') {
      return 'yarn lint || yarn eslint';
    }
    if (packageManager === 'pnpm') {
      return 'pnpm lint || pnpm eslint';
    }
    if (packageManager === 'bun') {
      return 'bun run lint || bun run eslint';
    }
  }
  return undefined;
}