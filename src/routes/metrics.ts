import { Router } from 'express'
import { runHogQL } from '../posthogClient.js'
import { clamp, parseDate, isoDate } from '../utils/time.js'

const router = Router()

function rangeFromQuery(q: any) {
	const now = new Date()
	const days = clamp(q.days, 1, 365, 30)
	const to = parseDate(q.to, now)
	const from = new Date(to)
	from.setDate(to.getDate() - days + 1)
	return { from: isoDate(from), to: isoDate(to) }
}

// Pageviews over time (daily)
router.get('/pageviews', async (req, res, next) => {
	try {
		const { from, to } = rangeFromQuery(req.query)
		const data = await runHogQL(
			`
      SELECT
        toDate(timestamp) AS day,
        countIf(event = '$pageview') AS pageviews
      FROM events
      WHERE timestamp >= toDate('${from}')
        AND timestamp < toDate('${to}') + INTERVAL 1 DAY
      GROUP BY day
      ORDER BY day
    `,
			'pageviews over time'
		)
		res.json({ from, to, results: data.results ?? [] })
	} catch (e) {
		next(e)
	}
})

// Active users (daily|weekly|monthly)
router.get('/active-users', async (req, res, next) => {
	try {
		const period = String(req.query.period || 'daily').toLowerCase()
		const bucket =
			period === 'weekly'
				? 'toStartOfWeek(timestamp)'
				: period === 'monthly'
				? 'toStartOfMonth(timestamp)'
				: 'toDate(timestamp)'

		const lookbackDays =
			period === 'weekly' ? 7 * 12 : period === 'monthly' ? 365 : 60
		const to = new Date()
		const from = new Date()
		from.setDate(to.getDate() - lookbackDays)

		const data = await runHogQL(
			`
      SELECT
        ${bucket} AS bucket,
        count(DISTINCT person_id) AS active_users
      FROM events
      WHERE timestamp >= toDate('${isoDate(from)}')
      GROUP BY bucket
      ORDER BY bucket
    `,
			`active users (${period})`
		)

		res.json({ period, results: data.results ?? [] })
	} catch (e) {
		next(e)
	}
})

// Top pages
router.get('/top-pages', async (req, res, next) => {
	try {
		const { from, to } = rangeFromQuery(req.query)
		const limit = clamp(req.query.limit, 1, 100, 20)
		const data = await runHogQL(
			`
      SELECT
        properties.$current_url AS url,
        count() AS views
      FROM events
      WHERE event = '$pageview'
        AND properties.$current_url IS NOT NULL
        AND timestamp >= toDate('${from}')
        AND timestamp < toDate('${to}') + INTERVAL 1 DAY
      GROUP BY url
      ORDER BY views DESC
      LIMIT ${limit}
    `,
			'top pages'
		)
		res.json({ from, to, results: data.results ?? [] })
	} catch (e) {
		next(e)
	}
})

// Top events (excluding $pageview)
router.get('/top-events', async (req, res, next) => {
	try {
		const { from, to } = rangeFromQuery(req.query)
		const limit = clamp(req.query.limit, 1, 100, 20)
		const data = await runHogQL(
			`
      SELECT
        event,
        count() AS occurrences
      FROM events
      WHERE event != '$pageview'
        AND timestamp >= toDate('${from}')
        AND timestamp < toDate('${to}') + INTERVAL 1 DAY
      GROUP BY event
      ORDER BY occurrences DESC
      LIMIT ${limit}
    `,
			'top events'
		)
		res.json({ from, to, results: data.results ?? [] })
	} catch (e) {
		next(e)
	}
})

// Referrers (from $pageview)
router.get('/referrers', async (req, res, next) => {
	try {
		const { from, to } = rangeFromQuery(req.query)
		const limit = clamp(req.query.limit, 1, 100, 20)
		const data = await runHogQL(
			`
      SELECT
        properties.$referrer AS referrer,
        countIf(event = '$pageview') AS visits
      FROM events
      WHERE event = '$pageview'
        AND properties.$referrer IS NOT NULL
        AND timestamp >= toDate('${from}')
        AND timestamp < toDate('${to}') + INTERVAL 1 DAY
      GROUP BY referrer
      ORDER BY visits DESC
      LIMIT ${limit}
    `,
			'referrers'
		)
		res.json({ from, to, results: data.results ?? [] })
	} catch (e) {
		next(e)
	}
})

// New users by first seen day
router.get('/new-users', async (req, res, next) => {
	try {
		const { from, to } = rangeFromQuery(req.query)
		const data = await runHogQL(
			`
      SELECT
        toDate(min(timestamp)) AS first_day,
        count(DISTINCT person_id) AS new_users
      FROM events
      WHERE timestamp >= toDate('${from}')
        AND timestamp < toDate('${to}') + INTERVAL 1 DAY
      GROUP BY person_id
      GROUP BY first_day
      ORDER BY first_day
    `,
			'new users'
		)
		res.json({ from, to, results: data.results ?? [] })
	} catch (e) {
		next(e)
	}
})

export default router
