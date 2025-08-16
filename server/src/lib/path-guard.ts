import path from 'node:path';

/**
 * Safely resolve a file path within a root directory, preventing path traversal attacks
 * @param root - The root directory that files must stay within
 * @param candidate - The candidate file path (can be relative or absolute)
 * @returns The normalized absolute path
 * @throws Error if the path would escape the root directory
 */
export function resolveSafe(root: string, candidate: string): string {
  // Normalize the root path
  const normalizedRoot = path.resolve(root);
  
  // Resolve the candidate path relative to the root
  const resolvedPath = path.resolve(normalizedRoot, candidate);
  
  // Check if the resolved path is within the root directory
  if (!resolvedPath.startsWith(normalizedRoot + path.sep) && resolvedPath !== normalizedRoot) {
    throw new Error(`Path traversal detected: ${candidate} would escape ${root}`);
  }
  
  return resolvedPath;
}

/**
 * Sanitize a filename for safe use in Content-Disposition headers
 * @param filename - The filename to sanitize
 * @returns A sanitized filename safe for HTTP headers
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and control characters
  return filename
    .replace(/[/\\]/g, '_')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/[<>:"|?*]/g, '_')
    .trim();
}

/**
 * Check if a file type is safe for inline preview
 * @param mimeType - The MIME type to check
 * @returns True if safe for inline preview
 */
export function isSafeForInlinePreview(mimeType: string): boolean {
  const safeMimeTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'text/xml',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript'
  ];
  
  return safeMimeTypes.includes(mimeType.toLowerCase());
}
