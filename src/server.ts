import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import metrics from './routes/metrics.js'
import funnels from './routes/funnels.js'
import retention from './routes/retention.js'
import health from './routes/health.js'

const app = express()
const PORT = Number(process.env.PORT || 4000)

app.use(cors()) // allow all origins
app.use(express.json({ limit: '1mb' }))

app.use('/api/metrics', metrics)
app.use('/api/funnels', funnels)
app.use('/api/retention', retention)
app.use('/api', health)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

app.use((err: any, _req: any, res: any, _next: any) => {
	// keep error simple
	res.status(500).json({ error: err?.message || 'Server error' })
})

app.listen(PORT, () => {
	console.log(`API on http://localhost:${PORT}`)
})
