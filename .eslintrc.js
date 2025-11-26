
module.exports = {
  extends: ['next/core-web-vitals'],
  plugins: ['local-rules'],
  rules: {
    '@next/next/no-img-element': 'off',
    'local-rules/enforce-fetch-caching': 'error',
  },
};
