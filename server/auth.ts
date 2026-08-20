import './loadEnv.js'
import type { NextFunction, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from './models.js'

function jwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-only-change-me'
}

const TOKEN_TTL = '30d'

export type AuthUser = {
  id: string
  email: string
}

export type AuthedRequest = Request & { user?: AuthUser }

function signToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email }, jwtSecret(), {
    expiresIn: TOKEN_TTL,
  })
}

export function publicUser(user: { _id: { toString(): string }; email: string }): AuthUser {
  return { id: user._id.toString(), email: user.email }
}

export async function register(
  email: string,
  password: string,
): Promise<{ user: AuthUser; token: string }> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || password.length < 6) {
    throw Object.assign(new Error('Email and a password of at least 6 characters are required.'), {
      status: 400,
    })
  }

  const existing = await User.findOne({ email: normalized })
  if (existing) {
    throw Object.assign(new Error('An account with that email already exists.'), { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const created = await User.create({ email: normalized, passwordHash })
  const user = publicUser(created)
  return { user, token: signToken(user) }
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: AuthUser; token: string }> {
  const normalized = email.trim().toLowerCase()
  const found = await User.findOne({ email: normalized })
  if (!found) {
    throw Object.assign(new Error('Invalid email or password.'), { status: 401 })
  }

  const ok = await bcrypt.compare(password, found.passwordHash)
  if (!ok) {
    throw Object.assign(new Error('Invalid email or password.'), { status: 401 })
  }

  const user = publicUser(found)
  return { user, token: signToken(user) }
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Sign in required.' })
    return
  }

  try {
    const payload = jwt.verify(token, jwtSecret()) as { sub: string; email: string }
    req.user = { id: payload.sub, email: payload.email }
    next()
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' })
  }
}

export async function getMe(userId: string): Promise<AuthUser | null> {
  const found = await User.findById(userId).select('email')
  if (!found) return null
  return publicUser(found)
}
