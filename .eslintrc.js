module.exports = {
  'parserOptions': {
    'ecmaVersion': 6
  },
  'env': {
    'browser': true,
    'node': true,
    'mocha': true
  },
  'extends': 'eslint:recommended',
  'rules': {
    'array-bracket-spacing': ['error', 'never'],
    'brace-style': ['error', '1tbs'],
    'camelcase': 'error',
    'computed-property-spacing': ['error', 'never'],
    'curly': 'error',
    'eol-last': 'error',
    'eqeqeq': ['error', 'smart'],
    'indent': ['error', 2],
    'keyword-spacing': ['error', {'before': true, 'after': true}],
    'max-depth': ['error', 3],
    'max-len':  ['error', 80],
    'max-nested-callbacks': ['error', 3],
    'new-cap': 'error',
    'no-extend-native': 'error',
    'no-mixed-spaces-and-tabs': 'error',
    'no-trailing-spaces': 'error',
    'no-unused-vars': 'error',
    'no-use-before-define': ['error', 'nofunc'],
    'no-var': 'error',
    'object-curly-spacing': ['error', 'never'],
    'quotes': ['error', 'single', 'avoid-escape'],
    'semi': ['error', 'always'],
    'space-in-parens': ['error', 'never'],
    'space-unary-ops': 'error'
  }
};
