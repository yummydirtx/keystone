/** @type {import('next').NextConfig} */
const { withTamagui } = require('@tamagui/next-plugin')
const { join } = require('node:path')

const boolVals = {
  true: true,
  false: false,
}

const disableExtraction =
  boolVals[process.env.DISABLE_EXTRACTION] ?? process.env.NODE_ENV === 'development'

const plugins = [
  withTamagui({
    config: '../../packages/config/src/tamagui.config.ts',
    components: ['tamagui', '@my/ui'],
    appDir: true,
    importsWhitelist: ['constants.js', 'colors.js'],
    outputCSS: process.env.NODE_ENV === 'production' ? './public/tamagui.css' : null,
    logTimings: true,
    disableExtraction,
    shouldExtract: (path) => {
      if (path.includes(join('packages', 'app'))) {
        return true
      }
    },
    disableThemesBundleOptimize: true,
    excludeReactNativeWebExports: ['Switch', 'ProgressBar', 'Picker', 'CheckBox', 'Touchable'],
  }),
]

module.exports = () => {
  /** @type {import('next').NextConfig} */
  let config = {
    typescript: {
      ignoreBuildErrors: true,
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'firebasestorage.googleapis.com',
          port: '',
          pathname: '/v0/b/**',
        },
        {
          protocol: 'https',
          hostname: 'storage.googleapis.com',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'ui-avatars.com',
          port: '',
          pathname: '/api/**',
        },
        {
          protocol: 'https',
          hostname: 'lh3.googleusercontent.com',
          port: '',
          pathname: '/**',
        },
      ],
    },
    transpilePackages: [
      'solito',
      'react-native-web',
      'expo-linking',
      'expo-constants',
      'expo-modules-core',
    ],
    experimental: {
      scrollRestoration: true,
    },
    headers: async () => {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-XSS-Protection',
              value: '0',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Content-Security-Policy',
              value:
                "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.google.com https://www.gstatic.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://api.keystone.com https://api.gokeystone.org https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://www.google.com https://content-firebaseappcheck.googleapis.com https://firebaseappcheck.googleapis.com https://firebasestorage.googleapis.com https://storage.googleapis.com; frame-src 'self' https://accounts.google.com https://www.google.com https://keystone-a4799.firebaseapp.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
            },
          ],
        },
      ]
    },
    webpack: (config, { isServer }) => {
      // Exclude React Native Firebase packages from client-side bundles
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
        }

        // Completely ignore React Native Firebase modules
        config.resolve.alias = {
          ...config.resolve.alias,
          '@react-native-firebase/app': false,
          '@react-native-firebase/auth': false,
          '@react-native-google-signin/google-signin': false,
          '@react-native-async-storage/async-storage': false,
        }

        // Add ignore plugin for React Native modules
        const webpack = require('webpack')
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^@react-native-firebase\//,
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^@react-native-google-signin\//,
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^@react-native-async-storage\//,
          })
        )
      }

      return config
    },
  }

  for (const plugin of plugins) {
    config = {
      ...config,
      ...plugin(config),
    }
  }

  return config
}
