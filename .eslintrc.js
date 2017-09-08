module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 7
  },
  // https://github.com/feross/standard/blob/master/RULES.md
  extends: 'standard',
  // required to lint *.vue files
  plugins: [
    'promise'
  ],
  // add your custom rules here
  rules: {
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  },
  env: {
    mocha: true,
    es6: true,
    node: true
  }
}
