module.exports = {
  presets: [
    ['@babel/preset-env', {
      modules: 'auto',
      targets: {
        node: 'current',
      },
    }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    '@babel/plugin-transform-modules-commonjs',
    ['@babel/plugin-transform-runtime', {
      regenerator: true,
    }],
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current',
          },
          modules: 'commonjs',
        }],
        '@babel/preset-react'
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        ['@babel/plugin-transform-runtime', {
          regenerator: true,
        }],
      ]
    }
  }
};
