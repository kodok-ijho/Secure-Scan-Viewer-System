import { resolveSafe, sanitizeFilename, isSafeForInlinePreview } from '../src/lib/path-guard';
import path from 'node:path';

describe('Path Guard', () => {
  const testRoot = '/safe/root';

  describe('resolveSafe', () => {
    test('allows safe paths within root', () => {
      const result = resolveSafe(testRoot, 'file.txt');
      expect(result).toBe(path.resolve(testRoot, 'file.txt'));
    });

    test('allows safe subdirectory paths', () => {
      const result = resolveSafe(testRoot, 'subdir/file.txt');
      expect(result).toBe(path.resolve(testRoot, 'subdir/file.txt'));
    });

    test('blocks path traversal with ../', () => {
      expect(() => resolveSafe(testRoot, '../../../etc/passwd')).toThrow('Path traversal detected');
    });

    test('blocks absolute paths outside root', () => {
      expect(() => resolveSafe(testRoot, '/etc/passwd')).toThrow('Path traversal detected');
    });

    test('blocks complex traversal attempts', () => {
      expect(() => resolveSafe(testRoot, 'subdir/../../etc/passwd')).toThrow('Path traversal detected');
    });
  });

  describe('sanitizeFilename', () => {
    test('removes path separators', () => {
      expect(sanitizeFilename('path/to/file.txt')).toBe('path_to_file.txt');
      expect(sanitizeFilename('path\\to\\file.txt')).toBe('path_to_file.txt');
    });

    test('removes control characters', () => {
      expect(sanitizeFilename('file\x00name.txt')).toBe('filename.txt');
    });

    test('removes dangerous characters', () => {
      expect(sanitizeFilename('file<>:"|?*.txt')).toBe('file_______.txt');
    });

    test('preserves safe characters', () => {
      expect(sanitizeFilename('safe-file_name.123.txt')).toBe('safe-file_name.123.txt');
    });
  });

  describe('isSafeForInlinePreview', () => {
    test('allows safe image types', () => {
      expect(isSafeForInlinePreview('image/jpeg')).toBe(true);
      expect(isSafeForInlinePreview('image/png')).toBe(true);
    });

    test('allows PDF', () => {
      expect(isSafeForInlinePreview('application/pdf')).toBe(true);
    });

    test('allows text types', () => {
      expect(isSafeForInlinePreview('text/plain')).toBe(true);
      expect(isSafeForInlinePreview('application/json')).toBe(true);
    });

    test('blocks potentially dangerous types', () => {
      expect(isSafeForInlinePreview('application/octet-stream')).toBe(false);
      expect(isSafeForInlinePreview('application/x-executable')).toBe(false);
    });
  });
});
