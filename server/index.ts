import './loadEnv.js'
import cors from 'cors'
import express from 'express'
import { getMe, login, register, requireAuth, type AuthedRequest } from './auth.js'
import { connectDb } from './db.js'
import { AppData } from './models.js'

const PORT = Number(process.env.PORT || 3001)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/habitsApp'

async function main() {
  await connectDb(MONGODB_URI)
  console.log('Connected to MongoDB')

  const app = express()
  app.use(cors({ origin: true, credentials: true }))
  app.use(express.json({ limit: '5mb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, db: true })
  })

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string }
      const result = await register(String(email ?? ''), String(password ?? ''))
      res.status(201).json(result)
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500
      const message = err instanceof Error ? err.message : 'Sign up failed.'
      console.error('Sign up failed', err)
      res.status(status).json({ error: message })
    }
  })

  app.post('/api/auth/signin', async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string }
      const result = await login(String(email ?? ''), String(password ?? ''))
      res.json(result)
    } catch (err) {
      const status = (err as { status?: number }).status ?? 500
      const message = err instanceof Error ? err.message : 'Sign in failed.'
      res.status(status).json({ error: message })
    }
  })

  app.get('/api/auth/me', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const user = await getMe(req.user!.id)
      if (!user) {
        res.status(401).json({ error: 'Account not found.' })
        return
      }
      res.json({ user })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load account.'
      res.status(500).json({ error: message })
    }
  })

  app.get('/api/data', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const doc = await AppData.findOne({ userId: req.user!.id })
      res.json({ data: doc?.data ?? null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data.'
      res.status(500).json({ error: message })
    }
  })

  app.put('/api/data', requireAuth, async (req: AuthedRequest, res) => {
    try {
      const { data } = req.body as { data?: unknown }
      if (data == null || typeof data !== 'object') {
        res.status(400).json({ error: 'App data payload is required.' })
        return
      }

      await AppData.findOneAndUpdate(
        { userId: req.user!.id },
        { data, userId: req.user!.id },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      res.json({ ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save data.'
      res.status(500).json({ error: message })
    }
  })

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error('Failed to start API server', err)
  process.exit(1)
})
