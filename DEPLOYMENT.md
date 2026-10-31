# Wefyx deployment

## Local development (macOS / Linux)

Run `sh backend/start-local.sh` and `npm --prefix web run dev` in separate terminals.
The backend uses the persistent local database and accepts any six-digit registration
code (for example `123456`) without Twilio or SMS. Local frontend origins on ports
5173 and 5174 are allowed. These settings apply only to this local launcher.

## Local development (Windows)

Run both services in separate terminals from the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\backend\start-local.ps1
```

```powershell
npm --prefix web run dev
```

Open `http://localhost:5173`. Keep the backend terminal running: Vite forwards `/api` to `http://127.0.0.1:8080`, and a stopped backend causes HTTP 502. Check `http://localhost:5173/api/bookings/catalog` to verify the connection. The backend uses the existing persistent local database by default; environment variables override settings in `backend/src/main/resources/application.yml`.

## Docker Compose

1. Install Docker Engine and Docker Compose on the server.
2. Copy this project to the server.
3. Copy `.env.example` to `.env` and replace every example secret and domain.
4. Run `docker compose up -d --build` from the `wefyx-project` directory.
5. Point the domain to the server and terminate HTTPS with the server load balancer or reverse proxy.

The web container serves the React SPA and proxies `/api` to the backend. PostgreSQL data is retained in the `wefyx_postgres` volume. Set `SEED_DATA=true` only for the first demo deployment; change it to `false` afterward.

## Required production values

- `DATABASE_PASSWORD`: unique database password.
- `ADMIN_PASSWORD`: strong initial administrator password.
- `JWT_SECRET`: at least 32 cryptographically random characters.
- `PUBLIC_URL`: exact HTTPS web application origin, without a trailing slash.

## Operations

- Logs: `docker compose logs -f`
- Status: `docker compose ps`
- Rebuild: `docker compose up -d --build`
- Stop: `docker compose down`
- Stop and delete database: `docker compose down -v` (destructive)

## Shop offers

Open **Admin → Offers & Promo Codes** (`/admin/offers`) to create or edit offers.
Choose a percentage or fixed AED discount, eligible products (empty means all),
purchase/rental scope, minimum eligible spend, maximum savings, and start/expiry
dates. Dates use UAE time and the expiry date is inclusive. Enable an offer to
publish it; disable it to stop new use without changing historical orders.

Customers can apply one code in the cart. The API prices the selected products,
checks eligibility again at checkout, calculates VAT after savings, and stores
the code and discount on the order and invoice. Refundable deposits are excluded
from the discount. No promotional codes are seeded automatically.


## Product images, service management and Stripe

- Product images can be uploaded in Admin → Products & Services (PNG/JPEG/WebP,
  up to 5 MB); image bytes persist in the backend database and are served through
  `/api/catalog/images/{id}`.
- Admin → Service Catalog manages service types, fees before VAT, VAT rates,
  working days, hours, appointment duration and the booking window. Saved bookings
  retain their quoted fee and service-name snapshots.
- Configure `PUBLIC_URL` to the public HTTPS website origin for hosted booking
  success/cancel redirects. Compose forwards it to the backend.
- Enable card payments in the Stripe account. Register one webhook endpoint:
  `https://YOUR_DOMAIN/api/orders/stripe/webhook`. It handles both product orders
  and service bookings. Subscribe to `checkout.session.completed`,
  `checkout.session.async_payment_succeeded`, `checkout.session.expired`,
  `payment_intent.succeeded` and `payment_intent.canceled`.
- Save that endpoint's signing secret as `STRIPE_WEBHOOK_SECRET`, matching live/test
  mode with the API keys. Restart the backend after changing environment settings.
  Online checkout stays unavailable without webhook configuration; offline product
  ordering and pending service requests remain available.
- Admin → Service Catalog shows a read-only Stripe readiness check. On 30 October
  2026 the configured live account returned `charges_enabled=false` and
  `card_payments=inactive`; the local signing secret was absent. Account activation
  and a reachable webhook are external requirements, not frontend changes.
