# posthog-express-api

A simple express api to fetch analytics data from posthog.

Example requests

GET /api/metrics/pageviews?days=30

GET /api/metrics/active-users?period=daily|weekly|monthly

GET /api/metrics/top-pages?days=7&limit=10

GET /api/metrics/top-events?days=30&limit=20

GET /api/metrics/referrers?days=30&limit=10

GET /api/metrics/new-users?days=30

GET /api/funnels/basic?days=30

GET /api/funnels/compute?events=signup,onboarded&date_from=-30d

GET /api/retention/weekly?weeks=12

GET /api/retention/compute?period=Week&date_from=-8w



TEST ENDPOINTS
- curl "http://localhost:4000/api/metrics/pageviews?days=30"
Response:
```json
{"from":"2025-08-20","to":"2025-09-18","results":[["2025-09-13",25]]}
```
- curl "http://localhost:4000/api/metrics/top-pages?days=7&limit=10"
Response:
```json
{"from":"2025-09-12","to":"2025-09-18","results":[["http://localhost:3000/admin/analytics",20],["http://localhost:3000/",4],["http://localhost:3000/admin/analytics/iframe",1]]}
```
- curl "http://localhost:4000/api/funnels/basic?days=30"
Response:
```json
{"results":[[0,0]]}
```

- curl "http://localhost:4000/api/retention/compute?period=Week&date_from=-8w"