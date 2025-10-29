const { withAppDelegate } = require('@expo/config-plugins')

function withFirebaseAuthSwift(config) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language === 'swift') {
      let contents = config.modResults.contents

      // Add Firebase import if not present
      if (!contents.includes('import FirebaseAuth')) {
        contents = contents.replace(
          /import FirebaseCore/,
          'import FirebaseCore\nimport FirebaseAuth'
        )
      }

      // Add Firebase configure call if not present
      if (!contents.includes('FirebaseApp.configure()')) {
        contents = contents.replace(
          /return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/,
          `FirebaseApp.configure()
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`
        )
      }

      // Add URL scheme handling for Firebase Auth
      if (!contents.includes('Auth.auth().canHandle(url)')) {
        contents = contents.replace(
          /return super\.application\(app, open: url, options: options\) \|\| RCTLinkingManager\.application\(app, open: url, options: options\)/,
          `if Auth.auth().canHandle(url) {
      return true
    }
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)`
        )
      }

      config.modResults.contents = contents
    }
    return config
  })
}

module.exports = withFirebaseAuthSwift
