const admin = require('firebase-admin');
const path = require('path');

// Path to your service account key file
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'keystone-a4799',
    storageBucket: 'keystone-a4799.firebasestorage.app'
  });
}

module.exports = admin;
