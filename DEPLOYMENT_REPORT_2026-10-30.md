# Wefyx production deployment — 30 October 2026

Deployed and verified at https://wefyx.pro and https://www.wefyx.pro.

- Existing Java/systemd and PostgreSQL architecture retained.
- Release SHA-256: `d541e699615a91dd978bc34f2d733db35bb8fc466d7b9e1a46520516a5db17bc`.
- Uploaded release was tested first against a separate PostgreSQL copy of the live database.
- Staging checks passed for migrations, product-image upload/download, custom-service
  booking, authentication, protected endpoints, and unconfigured-payment handling.
- Final backup taken with Wefyx stopped and API traffic temporarily held in maintenance.
- Preserved all 50 live products, their names/images/prices/stock, and the existing
  counts of users, orders, requirements, support tickets, bookings and addresses.
- Retired-sample migration was followed by restoring the previously active product
  entries through the administrator API, without overwriting production prices/stock.
- Removed stale Nginx `/portal` redirects to admin login; raised upload limit to 64 MB.
  Other hosted applications and HTTPS configuration were retained.
- Configured the production website/payment-return URLs and publishable key while
  preserving existing server secrets and authentication settings.
- Public HTTPS checks passed for the homepage, latest hashed frontend asset, shop,
  admin product/service pages, cart, customer service booking, portal and www hostname.
- Public catalog: 50 active products. All 50 images passed internal HTTP checks;
  sampled images passed public HTTPS checks. Three service definitions are available.
- Production systemd service is active/running, and `nginx -t` passes.
- Isolated candidate service stopped and temporary staging database removed.

Backups, previous JAR/config, final PostgreSQL dump, checks and cutover script are
stored privately on the VPS in:

`/opt/wefyx/releases/20261030-web-admin-v1`

Do not restore that database backup over subsequent customer activity without
first taking another backup and reviewing the changes since this deployment.

## External payment requirement

The production Stripe readiness check reports configured live keys, but
`chargesEnabled=false`, `cardPayments=inactive` and `webhookConfigured=false`.
Online payments remain unavailable until the merchant activates card payments and
configures the signed webhook. No live card charge was made during deployment.

## Employee/vendor registration follow-up
- Deployed `/register/employee` and `/register/vendor`, with matching role submissions and pending-approval success screens.
- Added website footer/authentication navigation links and both approval queues under admin Users Management.
- Release: `/opt/wefyx/releases/20261030-registration-v1`; previous JAR and database backup retained there.
- Application SHA-256: `bb5ba461d49ea71eb4589cbc73872cf7cafacd741cbaef5a627507fb02b820b4`.
- Live HTTPS employee and vendor pages verified in browser. Product catalog unchanged. 63 backend and 12 frontend tests passed; production build passed.
- First activation rolled back automatically because a bundle assertion expected a string split by the minifier. Corrected the assertion and redeployed successfully.
