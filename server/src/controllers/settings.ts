import { Response } from 'express';
import fs from 'node:fs';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/database';

export async function getSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const settings = await prisma.setting.findUnique({
      where: { id: 'singleton' }
    });

    if (!settings) {
      // Create default settings if not exists
      const defaultSettings = await prisma.setting.create({
        data: {
          id: 'singleton',
          sourceFolder: process.env.DEFAULT_SOURCE,
          retentionDays: parseInt(process.env.RETENTION_DAYS || '7')
        }
      });
      return res.json(defaultSettings);
    }

    res.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const { sourceFolder, retentionDays } = req.body;
    
    const updateData: any = {};
    if (sourceFolder !== undefined) updateData.sourceFolder = sourceFolder;
    if (retentionDays !== undefined) updateData.retentionDays = parseInt(retentionDays);

    const settings = await prisma.setting.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: {
        id: 'singleton',
        sourceFolder: sourceFolder || process.env.DEFAULT_SOURCE,
        retentionDays: retentionDays ? parseInt(retentionDays) : 7
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

export async function testFolderAccess(req: AuthenticatedRequest, res: Response) {
  try {
    const { folderPath } = req.body;
    
    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }
    
    if (!fs.existsSync(folderPath)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Folder does not exist' 
      });
    }
    
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Path is not a directory' 
      });
    }
    
    // Try to read the directory
    const files = fs.readdirSync(folderPath);
    
    res.json({
      success: true,
      message: 'Folder access successful',
      fileCount: files.length,
      path: folderPath
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: `Access denied: ${(error as Error).message}`
    });
  }
}
