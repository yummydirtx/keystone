// cleanup-storage.js

const { PrismaClient } = require('@prisma/client');
const admin = require('./src/config/firebase'); // Adjust path if needed

const prisma = new PrismaClient();
const storage = admin.storage().bucket();

// Set to true to preview what would be deleted without actually deleting
const DRY_RUN = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run');

async function getDatabaseImageReferences() {
  console.log('Fetching image references from the database...');
  const users = await prisma.user.findMany({
    select: { avatar_url: true },
    where: { avatar_url: { not: null } },
  });
  const expenses = await prisma.expense.findMany({
    select: { receipt_url: true },
    where: { receipt_url: { not: null } },
  });

  const references = new Set();
  users.forEach(user => references.add(user.avatar_url));
  expenses.forEach(expense => references.add(expense.receipt_url));

  console.log(`Found ${references.size} unique image references in the database.`);
  return references;
}

async function listFiles(prefix) {
  console.log(`Listing files in gs://${storage.name}/${prefix}...`);
  const [files] = await storage.getFiles({ prefix });
  console.log(`Found ${files.length} files in ${prefix}.`);
  return files;
}

async function deleteUnreferencedFiles() {
  try {
    const dbReferences = await getDatabaseImageReferences();
    const avatarFiles = await listFiles('avatars/');
    const receiptFiles = await listFiles('receipts/');

    const allFiles = [...avatarFiles, ...receiptFiles];
    let deletedCount = 0;

    console.log('Comparing database references against storage files...');
    console.log('Database references:', Array.from(dbReferences));
    
    for (const file of allFiles) {
      // Extract the file path from storage (e.g., "avatars/user123.jpg")
      const filePath = file.name;
      
      // Check if this file is referenced in the database
      // The database might store various URL formats:
      // - gs://bucket-name/avatars/user123.jpg
      // - https://storage.googleapis.com/bucket-name/avatars/user123.jpg
      // - https://firebasestorage.googleapis.com/v0/b/bucket-name/o/avatars%2Fuser123.jpg
      // - Just the file path: avatars/user123.jpg
      const isReferenced = Array.from(dbReferences).some(ref => {
        if (!ref) return false;
        
        // Direct path match
        if (ref === filePath) return true;
        
        // Check if the reference URL contains the file path
        if (ref.includes(filePath)) return true;
        
        // Handle URL-encoded paths (Firebase storage URLs encode slashes as %2F)
        const encodedPath = encodeURIComponent(filePath);
        if (ref.includes(encodedPath)) return true;
        
        return false;
      });

      if (!isReferenced) {
        if (DRY_RUN) {
          console.log(`[DRY RUN] Would delete unreferenced file: ${file.name}`);
        } else {
          console.log(`Deleting unreferenced file: ${file.name}`);
          await file.delete();
        }
        deletedCount++;
      } else {
        console.log(`Keeping referenced file: ${file.name}`);
      }
    }

    if (DRY_RUN) {
      console.log(`\n[DRY RUN] Would delete ${deletedCount} unreferenced files.`);
      console.log('To actually delete files, run without --dry-run flag.');
    } else {
      console.log(`\nCleanup complete. Deleted ${deletedCount} unreferenced files.`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Show usage information
if (DRY_RUN) {
  console.log('=== DRY RUN MODE ===');
  console.log('This will show what files would be deleted without actually deleting them.');
  console.log('To actually delete files, run: node cleanup-storage.js');
  console.log('====================\n');
} else {
  console.log('=== LIVE MODE ===');
  console.log('This will actually delete unreferenced files.');
  console.log('To preview changes first, run: node cleanup-storage.js --dry-run');
  console.log('==================\n');
}

deleteUnreferencedFiles();
