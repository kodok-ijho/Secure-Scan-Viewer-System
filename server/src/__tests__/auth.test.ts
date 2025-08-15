import request from 'supertest'
import { createApp } from './app'
import { prisma } from '../config/database'
import bcrypt from 'bcryptjs'
import { Role } from '../types/common'

describe('Authentication', () => {
  let app: any

  beforeAll(async () => {
    app = await createApp()
  })

  beforeEach(async () => {
    // Create test user
    const passwordHash = await bcrypt.hash('testpass123', 12)
    await prisma.user.create({
      data: {
        username: 'testuser',
        passwordHash,
        role: 'USER',
      },
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body.user).toMatchObject({
        username: 'testuser',
        role: 'USER',
      })
    })

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'testpass123',
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })

    it('should validate input', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: '',
          password: '',
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // First login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
        })

      const { refreshToken } = loginResponse.body

      // Use refresh token to get new access token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })

      expect(refreshResponse.status).toBe(200)
      expect(refreshResponse.body).toHaveProperty('accessToken')
    })

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'some-token' })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('message')
    })
  })
})
