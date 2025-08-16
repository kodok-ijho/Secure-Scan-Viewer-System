import fs from 'node:fs';
import path from 'node:path';

// Import the cleanup function
const cleanupOldFiles = async () => {
  const { cleanupOldFiles: cleanup } = await import('../scripts/cleanup');
  return cleanup();
};

describe('Cleanup', () => {
  const testDir = path.join(__dirname, 'temp-cleanup-test');
  
  beforeEach(() => {
    // Create test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    // Override storage path for testing
    process.env.LOCAL_STORAGE_PATH = testDir;
    process.env.RETENTION_MINUTES = '1'; // 1 minute retention for testing
  });

  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  test('deletes old files and preserves new files', async () => {
    // Create old file (2 minutes ago)
    const oldFile = path.join(testDir, 'old-file.txt');
    fs.writeFileSync(oldFile, 'old content');
    const oldTime = Date.now() - (2 * 60 * 1000); // 2 minutes ago
    fs.utimesSync(oldFile, new Date(oldTime), new Date(oldTime));

    // Create new file (now)
    const newFile = path.join(testDir, 'new-file.txt');
    fs.writeFileSync(newFile, 'new content');

    // Create empty subdirectory
    const emptyDir = path.join(testDir, 'empty-subdir');
    fs.mkdirSync(emptyDir);

    // Run cleanup
    await cleanupOldFiles();

    // Check results
    expect(fs.existsSync(oldFile)).toBe(false); // Old file should be deleted
    expect(fs.existsSync(newFile)).toBe(true);  // New file should remain
    expect(fs.existsSync(emptyDir)).toBe(false); // Empty directory should be removed
  });

  test('handles non-existent storage directory gracefully', async () => {
    process.env.LOCAL_STORAGE_PATH = '/non/existent/path';
    
    // Should not throw error
    await expect(cleanupOldFiles()).resolves.not.toThrow();
  });

  test('respects retention settings', async () => {
    // Set very short retention (0 minutes = delete everything)
    process.env.RETENTION_MINUTES = '0';
    process.env.RETENTION_DAYS = '0';

    const testFile = path.join(testDir, 'test-file.txt');
    fs.writeFileSync(testFile, 'test content');

    await cleanupOldFiles();

    expect(fs.existsSync(testFile)).toBe(false);
  });
});
