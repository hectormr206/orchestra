import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      // Code quality rules
      'no-duplicate-imports': 'error',
      'no-console': 'off',
      'no-unused-vars': 'off',  // TypeScript handles this
      'no-undef': 'off',  // TypeScript handles this

      // Complexity rule (measure average complexity)
      'complexity': ['warn', { max: 15 }],

      // Import rules (check for duplication)
      'import/no-duplicates': 'error',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.test.ts',
      '*.test.tsx',
      'build/**',
      'src/web/**',
      '.orchestra/**',
    ],
  },
];
