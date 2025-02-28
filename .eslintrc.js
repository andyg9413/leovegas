module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    '@typescript-eslint/no-floating-promises': ['error', {
      'ignoreVoid': true,
      'ignoreIIFE': true
    }],
    '@typescript-eslint/ban-types': [
      'error',
      {
        'types': {
          'String': {
            'message': 'Use string instead',
            'fixWith': 'string'
          },
          'Boolean': {
            'message': 'Use boolean instead',
            'fixWith': 'boolean'
          },
          'Number': {
            'message': 'Use number instead',
            'fixWith': 'number'
          },
          'Object': {
            'message': 'Use object instead',
            'fixWith': 'object'
          },
          'Symbol': {
            'message': 'Use symbol instead',
            'fixWith': 'symbol'
          },
          'Function': {
            'message': 'The `Function` type accepts any function-like value.\nIt provides no type safety when calling the function, which can be a common source of bugs.\nIt also accepts things like class declarations, which will throw at runtime as they will not be called with `new`.\nIf you are expecting the function to accept certain arguments, you should explicitly define the function shape.',
            'fixWith': '(...args: any[]) => any'
          }
        },
        'extendDefaults': false
      }
    ],
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/unbound-method': ['error', {
      'ignoreStatic': true
    }],
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        'checksVoidReturn': false
      }
    ],
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': 'off'
  },
  overrides: [
    {
      files: ['*.spec.ts', '*.e2e-spec.ts'],
      rules: {
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off'
      }
    }
  ]
}; 