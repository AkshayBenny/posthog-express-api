import 'dotenv/config'
import { fetch } from 'undici'

const HOST = process.env.POSTHOG_HOST!
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID!
const KEY = process.env.POSTHOG_PERSONAL_API_KEY!
const BASE = `${HOST}/api/projects/${PROJECT_ID}`

if (!HOST || !PROJECT_ID || !KEY) throw new Error('Missing POSTHOG_* env vars')

async function post<T = any>(path: string, body: unknown): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${KEY}`,
		},
		body: JSON.stringify(body),
	})
	const text = await res.text()
	if (!res.ok) throw new Error(text || `PostHog error ${res.status}`)
	return (text ? JSON.parse(text) : {}) as T
}

export function runHogQL(query: string, name = 'hogql') {
	return post('/query/', {
		name,
		query: { kind: 'HogQLQuery', query },
	})
}

export function computeInsight(payload: any) {
	// Mirrors PostHog's "Trends/Funnels/Retention" compute endpoints
	return post('/insights/trend/', payload)
}
