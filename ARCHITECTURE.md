# Architecture

## Current boundaries

- `public/game-rules.js` contains deterministic economy formulas shared by the browser and server.
- `lib/land.js` owns land-id validation and connectivity checks.
- `server.js` remains the HTTP composition root while the existing game is kept backward compatible.
- PostgreSQL receives normalized table definitions for users, land, transactions, assets, and sessions. The current JSON state remains the active source of truth during the gradual migration.

## Next extraction order

1. Move ownership validation to `lib/land.js`.
2. Move settings sanitation and shared persistence adapters to `lib/persistence.js`.
3. Move purchase, refund, daily-income, and asset operations to `lib/economy.js` and `lib/assets.js`.
4. Move API route handlers into `routes/players.js`, `routes/admin.js`, `routes/messages.js`, and `routes/marketplace.js`.
5. Replace JSON-state writes with transactional normalized-table writes after a verified data migration and backup.

## Data migration

The new tables are intentionally additive. Do not remove `app_state` or migrate live production data until a backup, a row-count reconciliation, and a rollback procedure are prepared.
