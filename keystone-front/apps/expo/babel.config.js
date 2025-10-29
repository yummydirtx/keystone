module.exports = (api) => {
  api.cache(true)
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxRuntime: 'automatic',
          lazyImports: true,
          native: {
            unstable_transformProfile: 'hermes-stable',
          },
        },
      ],
    ],
    plugins: [
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          root: ['../..'],
          alias: {
            // define aliases to shorten the import paths
            app: '../../packages/app',
            '@my/ui': '../../packages/ui',
          },
          extensions: ['.js', '.jsx', '.tsx', '.ios.js', '.android.js'],
        },
      ],
      // Add explicit environment variable plugin for EXPO_OS
      [
        'babel-plugin-transform-inline-environment-variables',
        {
          exclude: ['NODE_ENV'],
        },
      ],
      // if you want reanimated support
      'react-native-reanimated/plugin',
      ...(process.env.EAS_BUILD_PLATFORM === 'android'
        ? []
        : [
            [
              '@tamagui/babel-plugin',
              {
                components: ['@my/ui', 'tamagui'],
                config: '../../packages/config/src/tamagui.config.ts',
                logTimings: true,
                disableExtraction: process.env.NODE_ENV === 'development',
              },
            ],
          ]),
    ],
    env: {
      production: {
        plugins: ['babel-plugin-transform-remove-console'],
      },
    },
  }
}
