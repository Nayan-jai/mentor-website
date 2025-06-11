import { POST } from '../route'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// Mock the prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('Forgot Password API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if email is missing', async () => {
    const request = new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe('Email is required')
  })

  it('should return 200 with success message if user not found', async () => {
    // Mock user not found
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('If an account exists with this email, you will receive a password reset link.')
    expect(data.resetToken).toBeDefined()
  })

  it('should generate reset token for existing user', async () => {
    // Mock existing user
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
    })

    // Mock token update
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      resetToken: 'hashed_token',
      resetTokenExpiry: new Date(),
    })

    const request = new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Password reset link has been generated.')
    expect(data.resetToken).toBeDefined()
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      data: expect.objectContaining({
        resetToken: expect.any(String),
        resetTokenExpiry: expect.any(Date),
      }),
    })
  })

  it('should handle database errors gracefully', async () => {
    // Mock database error
    ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.message).toBe('Failed to process request')
  })
}) 