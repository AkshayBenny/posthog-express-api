import { Router } from 'express'
import { clamp } from '../utils/time.js'
import { runHogQL, computeInsight } from '../posthogClient.js'

const router = Router()

// Weekly retention matrix via HogQL
router.get('/weekly', async (req, res, next) => {
	try {
		const weeks = clamp(req.query.weeks, 1, 20, 12)
		const data = await runHogQL(
			`
      WITH
        first_week AS (
          SELECT person_id, toStartOfWeek(min(timestamp)) AS cohort_week
          FROM events
          GROUP BY person_id
        ),
        activity AS (
          SELECT person_id, toStartOfWeek(timestamp) AS active_week
          FROM events
          WHERE timestamp >= now() - INTERVAL ${weeks} WEEK
        )
      SELECT
        cohort_week,
        active_week,
        count(DISTINCT activity.person_id) AS returning_users
      FROM activity
      INNER JOIN first_week USING (person_id)
      GROUP BY cohort_week, active_week
      ORDER BY cohort_week, active_week
    `,
			'weekly retention'
		)
		res.json({ results: data.results ?? [] })
	} catch (e) {
		next(e)
	}
})

// Retention via compute API (same as UI "Retention")
router.get('/compute', async (req, res, next) => {
	try {
		const period = String(req.query.period || 'Week') // Day|Week|Month
		const date_from = String(req.query.date_from || '-8w')

		const payload = {
			insight: 'RETENTION',
			period,
			date_from,
			retention_type: 'retention',
			target_entity: {
				id: '$pageview',
				type: 'events',
				name: '$pageview',
			},
			returning_entity: {
				id: '$pageview',
				type: 'events',
				name: '$pageview',
			},
		}

		const data = await computeInsight(payload)
		res.json(data)
	} catch (e) {
		next(e)
	}
})

export default router
