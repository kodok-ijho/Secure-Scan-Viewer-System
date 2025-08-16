import { Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import mime from 'mime-types';
import { AuthenticatedRequest } from '../middleware/auth';
import { resolvePaths, listFiles, getFileStats } from '../lib/fs-init';
import { prisma } from '../lib/database';

function extractOwnerFromFilename(filename: string): string | null {
  const parts = filename.split('_');
  if (parts.length >= 2) {
    return parts[0];
  }
  return null;
}

export async function listUserFiles(req: AuthenticatedRequest, res: Response) {
  try {
    const { localRoot } = resolvePaths();
    
    if (!fs.existsSync(localRoot)) {
      return res.json([]);
    }

    const files = listFiles(localRoot);
    const fileInfos = files.map(filename => {
      const filePath = path.join(localRoot, filename);
      const stats = getFileStats(filePath);
      const owner = extractOwnerFromFilename(filename);
      
      if (!stats) return null;
      
      return {
        name: filename,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
        owner: owner || 'Unassigned (Admin only)',
        type: path.extname(filename).toLowerCase()
      };
    }).filter(Boolean);

    // Filter files based on user role
    let filteredFiles = fileInfos;
    if (req.user?.role === 'USER') {
      filteredFiles = fileInfos.filter(file => {
        return file?.name.startsWith(req.user!.username + '_');
      });
    }

    res.json(filteredFiles);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
}

export async function streamFile(req: AuthenticatedRequest, res: Response) {
  try {
    const filename = req.params.filename;
    const { localRoot } = resolvePaths();
    const filePath = path.join(localRoot, filename);

    // Check if user has access to this file
    if (req.user?.role === 'USER') {
      if (!filename.startsWith(req.user.username + '_')) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const mimeType = mime.lookup(filename) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error streaming file:', error);
    res.status(500).json({ error: 'Failed to stream file' });
  }
}

export async function downloadFile(req: AuthenticatedRequest, res: Response) {
  try {
    const filename = req.params.filename;
    const { localRoot } = resolvePaths();
    const filePath = path.join(localRoot, filename);

    // Check if user has access to this file
    if (req.user?.role === 'USER') {
      if (!filename.startsWith(req.user.username + '_')) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const mimeType = mime.lookup(filename) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
}

export async function deleteFile(req: AuthenticatedRequest, res: Response) {
  try {
    const filename = req.params.filename;
    const { localRoot } = resolvePaths();
    const filePath = path.join(localRoot, filename);

    // Check if user has access to this file
    if (req.user?.role === 'USER') {
      if (!filename.startsWith(req.user.username + '_')) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    
    // Create log entry
    if (req.user) {
      await prisma.log.create({
        data: {
          filename,
          localPath: filePath,
          action: 'MANUAL_DELETED',
          actorId: req.user.id
        }
      });
    }
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
}
