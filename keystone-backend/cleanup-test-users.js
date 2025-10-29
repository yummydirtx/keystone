#!/usr/bin/env node

/**
 * Firebase Test User Cleanup Script
 * 
 * This script removes all users from Firebase Authentication whose email addresses
 * contain BOTH "test" AND "@example.com"
 * 
 * Usage: node cleanup-test-users.js [--dry-run] [--confirm]
 */

const admin = require('./src/config/firebase');
const readline = require('readline');

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const autoConfirm = args.includes('--confirm');

// Batch size for deletion (Firebase recommends max 1000)
const BATCH_SIZE = 100;

/**
 * Check if email contains both "test" and "@example.com"
 */
function isTestUser(email) {
  if (!email) return false;
  const emailLower = email.toLowerCase();
  return emailLower.includes('test') && emailLower.includes('@example.com');
}

/**
 * Get user confirmation before proceeding with deletion
 */
function getUserConfirmation(userCount) {
  return new Promise((resolve) => {
    if (autoConfirm) {
      resolve(true);
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`\n⚠️  WARNING: This will permanently delete ${userCount} users!`);
    console.log('Users with emails containing BOTH "test" AND "@example.com" will be removed.');
    
    rl.question('\nAre you sure you want to proceed? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * List all users and filter test users
 */
async function getTestUsers() {
  console.log('🔍 Scanning Firebase users...');
  
  const testUsers = [];
  let nextPageToken;
  let totalScanned = 0;

  try {
    do {
      // List users in batches of 1000 (Firebase limit)
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      
      listUsersResult.users.forEach((user) => {
        totalScanned++;
        
        if (isTestUser(user.email)) {
          testUsers.push({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'No display name',
            creationTime: user.metadata.creationTime
          });
        }
      });

      nextPageToken = listUsersResult.pageToken;
      
      // Show progress
      process.stdout.write(`\rScanned: ${totalScanned} users, Found test users: ${testUsers.length}`);
      
    } while (nextPageToken);

    console.log(`\n✅ Scan complete. Total users scanned: ${totalScanned}`);
    return testUsers;

  } catch (error) {
    console.error('❌ Error listing users:', error);
    throw error;
  }
}

/**
 * Delete users in batches
 */
async function deleteUsers(users) {
  if (users.length === 0) {
    console.log('✅ No test users found to delete.');
    return;
  }

  console.log(`\n🗑️  Starting deletion of ${users.length} test users...`);
  
  let deletedCount = 0;
  let errorCount = 0;

  // Process users in batches
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const uids = batch.map(user => user.uid);
    
    try {
      // Delete batch of users
      const deleteUsersResult = await admin.auth().deleteUsers(uids);
      
      deletedCount += deleteUsersResult.successCount;
      errorCount += deleteUsersResult.failureCount;
      
      // Log any failures
      if (deleteUsersResult.errors && deleteUsersResult.errors.length > 0) {
        console.log(`\n⚠️  Batch ${Math.floor(i/BATCH_SIZE) + 1} had ${deleteUsersResult.errors.length} errors:`);
        deleteUsersResult.errors.forEach(error => {
          const user = batch.find(u => u.uid === error.index);
          console.log(`  - Failed to delete ${user?.email || 'unknown'}: ${error.error.message}`);
        });
      }
      
      // Show progress
      process.stdout.write(`\rDeleted: ${deletedCount}/${users.length} users`);
      
      // Small delay to avoid rate limiting
      if (i + BATCH_SIZE < users.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`\n❌ Error deleting batch starting at index ${i}:`, error);
      errorCount += batch.length;
    }
  }
  
  console.log(`\n\n✅ Deletion complete!`);
  console.log(`   Successfully deleted: ${deletedCount} users`);
  console.log(`   Errors: ${errorCount} users`);
}

/**
 * Main execution function
 */
async function main() {
  console.log('🧹 Firebase Test User Cleanup Script');
  console.log('=====================================');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No users will be deleted');
  }
  
  console.log('📋 Filtering criteria: emails containing BOTH "test" AND "@example.com"');

  try {
    // Get list of test users
    const testUsers = await getTestUsers();
    
    if (testUsers.length === 0) {
      console.log('\n✅ No test users found matching the criteria.');
      return;
    }

    // Show found users
    console.log(`\n📋 Found ${testUsers.length} test users:`);
    testUsers.slice(0, 10).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.uid})`);
    });
    
    if (testUsers.length > 10) {
      console.log(`   ... and ${testUsers.length - 10} more users`);
    }

    if (isDryRun) {
      console.log('\n🔍 DRY RUN: No users were deleted.');
      console.log('Run without --dry-run to actually delete these users.');
      return;
    }

    // Get confirmation
    const confirmed = await getUserConfirmation(testUsers.length);
    
    if (!confirmed) {
      console.log('\n❌ Operation cancelled by user.');
      return;
    }

    // Delete users
    await deleteUsers(testUsers);

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Script interrupted by user.');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { isTestUser, getTestUsers, deleteUsers };
