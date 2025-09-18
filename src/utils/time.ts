export function clamp(n: any, min: number, max: number, def: number) {
	const x = Number(n)
	if (Number.isNaN(x)) return def
	return Math.min(Math.max(x, min), max)
}

export function parseDate(s: any, def: Date) {
	if (!s) return def
	const d = new Date(s)
	return Number.isNaN(d.getTime()) ? def : d
}

export function isoDate(d: Date) {
	return d.toISOString().slice(0, 10)
}
