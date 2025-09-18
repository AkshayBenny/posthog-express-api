import { Router } from "express";
import { clamp } from "../utils/time.js";
import { runHogQL, computeInsight } from "../posthogClient.js";

const router = Router();

// Simple 2-step funnel via HogQL (signup -> onboarded)
router.get("/basic", async (req, res, next) => {
  try {
    const days = clamp(req.query.days, 1, 90, 30);
    const data = await runHogQL(
      `
      WITH
        step1 AS (
          SELECT DISTINCT person_id
          FROM events
          WHERE event = 'signup' AND timestamp >= now() - INTERVAL ${days} DAY
        ),
        step2 AS (
          SELECT DISTINCT person_id
          FROM events
          WHERE event = 'onboarded' AND timestamp >= now() - INTERVAL ${days} DAY
        )
      SELECT
        (SELECT count() FROM step1) AS step1_count,
        (SELECT count() FROM step2 INNER JOIN step1 USING (person_id)) AS step2_count
    `,
      "basic funnel"
    );
    res.json({ results: data.results ?? [] });
  } catch (e) {
    next(e);
  }
});

// Funnel via PostHog compute API (same engine as UI)
router.get("/compute", async (req, res, next) => {
  try {
    const events = String(req.query.events || "$pageview,signup,onboarded")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    const date_from = String(req.query.date_from || "-30d");
    const breakdown_type = req.query.breakdown_type ? String(req.query.breakdown_type) : null; // "event"|"person"|"cohort"
    const breakdown = req.query.breakdown ? String(req.query.breakdown) : null;

    const payload: any = {
      insight: "FUNNELS",
      date_from,
      filter_test_accounts: false,
      events: events.map((name, i) => ({ id: name, type: "events", order: i, name })),
    };
    if (breakdown && breakdown_type) {
      payload.breakdown = breakdown;
      payload.breakdown_type = breakdown_type;
    }

    const data = await computeInsight(payload);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

export default router;
