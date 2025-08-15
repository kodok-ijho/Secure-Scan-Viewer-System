import request from 'supertest'
import { createApp } from './app'
import { prisma } from '../config/database'
import { JwtService } from '../utils/jwt'
import bcrypt from 'bcryptjs'
import { Role } from '../types/common'

describe('Files API', () => {
  let app: any
  let userToken: string
  let adminToken: string

  beforeAll(async () => {
    app = await createApp()
  })

  beforeEach(async () => {
    // Create test users
    const userPasswordHash = await bcrypt.hash('userpass123', 12)
    const adminPasswordHash = await bcrypt.hash('adminpass123', 12)

    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        passwordHash: userPasswordHash,
        role: 'USER',
      },
    })

    const admin = await prisma.user.create({
      data: {
        username: 'testadmin',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
      },
    })

    // Generate tokens
    userToken = JwtService.generateAccessToken({
      id: user.id,
      username: user.username,
      role: user.role,
    })

    adminToken = JwtService.generateAccessToken({
      id: admin.id,
      username: admin.username,
      role: admin.role,
    })
  })

  describe('GET /api/files', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/files')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('should return files for authenticated user', async () => {
      const response = await request(app)
        .get('/api/files')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should allow admin to filter by owner', async () => {
      const response = await request(app)
        .get('/api/files?owner=testuser')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })
  })

  describe('DELETE /api/files/:name', () => {
    it('should require authentication', async () => {
      const response = await request(app).delete('/api/files/test.txt')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .delete('/api/files/nonexistent.txt')
        .set('Authorization', `Bearer ${userToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('error')
    })
  })
})
