# Wefyx workflow verification — 30 October 2026

The local application had genuine workflow failures. They were reproduced and
corrected below. This is a local test report, not a claim that the deployed site
or every production integration has been verified.

## Verification

- Backend: 62 tests passing, zero failures/errors, including thirteen integration
  scenarios against an isolated in-memory database.
- Frontend: 12 frontend tests passing (role routing and dynamic catalog/cart); production build passes.
- Maven produces `backend/target/wefyx-platform-1.0.0.jar` successfully.
- Docker Compose configuration validates. Container build/run was not exercised:
  the local Docker engine is stopped.
- Browser checked in Chrome against a separate local server on port 18080 with
  an in-memory database: customer/employee/vendor email login and correct portal
  destinations, customer sign-out, employee service-task empty state, catalog
  search, add-to-cart/header count, default delivery address selection, saved-address
  edit/save, administrator login and product-targeted offer creation. The admin-created
  10% code changed an AED 100 cart to AED 94.50 including VAT.
- Earlier browser checks covered the booking calendar, available slots, past-date
  restrictions and service-history sign-in boundary.
- Mobile dependency installation was attempted for customer, employee and vendor
  apps. All three failed with ENOSPC (disk full). Only the partial node_modules
  directories and temporary npm cache created by this attempt were removed.
  Native mobile tests/builds were not run.
- No real SMS, email, card charge, or client-record changes were used for workflow tests.

## Coverage

| Flow | What was exercised |
| --- | --- |
| Customer / employee / vendor | Email/password login, role identity, wrong password, restricted admin endpoints |
| Employee / vendor onboarding | Registration, pending-account login rejection, administrator approval, successful login |
| Product purchase | Catalog price overrides client-supplied price, targeted offer, VAT, totals, inventory decrement, cancellation and idempotent stock restoration |
| Rental / mixed cart | Rental duration, mixed purchase/rental pricing, deposit limited to rental lines, inventory |
| Requirements / quotations | Customer request, employee acceptance, vendor invitation/acceptance, quotation submission/review, customer confirmation, selected vendor fulfilment, resolution and closure |
| Product administration | Admin creation/edit with image URL, buy/rent prices, stock; public persistence, duplicate SKU rejection, role restrictions, excess/zero-stock order rejection, inactive product hidden |
| Admin modules | Administrator CRUD; customer/employee/vendor read/write denied; mismatched module IDs rejected |
| Address book | Owner edit/delete, persistence and cross-customer isolation |
| Cancellation / notifications | Customer request, employee approval, inventory restoration, terminal-state rejection and recipient-only notification reads |
| Public support | Anonymous inquiry, employee list/reply, blank reply validation, customer/vendor access denied; email disabled |
| Assignment isolation | Other customers, other employees and uninvited/unselected vendors denied access to protected work |
| Support tickets | Assignment, customer/employee messages, unauthorized access rejection, resolution and customer reopening |
| Booked services | Request creation/idempotency, unavailable payment response, internal test-only verified-payment boundary, engineer assignment, start, report and customer visibility |
| Offers | Product/mode eligibility, minimum eligible spend, percentage/fixed discounts, caps, expiry/start dates, inactive codes, rounding, changed quantities |

## Defects corrected

1. Employee/vendor sign-in redirected to admin-only login; `/portal` never rendered
   the existing employee/vendor dashboards. Both now use their role-specific portal.
2. Employee status and quotation approval controls called nonexistent endpoints.
   They now call the supported workflow actions and retain the returned server state.
3. Strict quotation confirmation did not record the selected vendor, blocking that
   vendor from starting work. Confirmation now records the assignment.
4. Customer account requirements had no quotation review/acceptance or conversation
   action. These are now available in requirement details.
5. Vendor portal had no start/resolve controls and classified completed requirements
   using quotation status alone. Fulfilment actions and history classification were fixed.
6. Mixed carts charged a refundable rental deposit on purchased goods. Only rental
   lines now contribute to the deposit; preview and order creation share the calculation.
7. Booking calendar and time labels were hardcoded to September 2025 and values did
   not match the backend slot format. Calendar and availability now use actual dates/API slots.
8. Booking failures fabricated an assigned booking and navigated to a success page.
   Fake records and confirmations were removed. Failures remain visible, and saved
   requests show their real pending-payment status.
9. Service ticket/report pages displayed demo records and technician previews.
   They now load authorized backend records and persist real start/report actions.
10. Registration resend returned to the business form instead of requesting another
    code. It now calls the registration OTP request flow.
11. Header could show a signed-in customer after their token was removed. It now
    checks for a token and responds to session-expiry events.
12. Backend Dockerfile copied the wrong JAR filename. Deployment also omitted
    Stripe/Twilio configuration. Filename, build/public key and backend environment wiring were corrected.
13. Old tests incorrectly expected valid Indian numbers to be rejected; assertions
    now match the existing UAE/India support. The context test now uses an isolated DB.

14. Generic admin module records were available to every authenticated role.
    Regression testing reproduced a customer receiving HTTP 200 from the permissions
    endpoint. All resource-module endpoints now require SUPER_ADMIN. Update/status/delete
    also verify that the record belongs to the module named in the URL and return 404
    on mismatches.

15. Rental detail routing accepted only the seeded Dell SKU, and details contained
    hardcoded Dell descriptions, stock labels and fallback prices. All rental SKU
    routes now load their actual product name, specifications, description, image,
    price and stock. Missing/non-rentable products display an unavailable state;
    out-of-stock actions are disabled and quantities are bounded. Catalog names
    link to those detail pages. Chrome verified the APC UPS details and missing-SKU
    error; web build and regression suite pass.

## Remaining limitations before client sign-off

- **External Stripe activation is required.** Two read-only live account checks on
  30 October 2026 returned `charges_enabled=false` and `card_payments=inactive`.
  The local `STRIPE_WEBHOOK_SECRET` is also absent. No live charge was created.
  Integration code is implemented and tested with mocked Stripe responses, but
  production card settlement cannot be verified until the merchant enables card
  payments and configures a reachable signed webhook.
- The 50 product prices and stock quantities retain the existing catalog values.
  A verified supplier/physical-stock source was not provided; commercial accuracy
  cannot be established by application tests.
- Deployed to wefyx.pro on 30 October 2026; see DEPLOYMENT_REPORT_2026-10-30.md for production checks and backup details.
- Mobile apps and Twilio are excluded at the user's request. Earlier native setup
  was blocked by disk space; neither is claimed as verified.
- Docker/PostgreSQL runtime was not exercised because the local Docker engine is
  stopped. H2 migrations for existing bookings and new installations pass.
- The production frontend bundle is about 1.17 MB before gzip. Device/network
  performance has not been measured.

## Dynamic catalog change

- Deleted automatic `CatalogSeedData`; startup no longer creates sample products
  or overwrites administrator product metadata.
- Migration V3 archives the 50 bundled sample SKUs (keeps rows/order history),
  preserves other administrator-created SKUs, and creates an empty catalog schema
  on fresh installations. Migration preservation and fresh-empty tests pass.
- Removed hardcoded shop/rental product lists, name-to-SKU maps, cart suggestions,
  named header promotions and demo asset/product arrays.
- Shop, rentals, product details, header product search and cart recommendations
  read administrator catalog records. Categories, counts, featured labels, prices,
  image URLs and availability are driven by those records.
- Catalog views refresh on page load, browser focus, same-browser admin save events,
  and every 30 seconds. Errors/empty catalogs show explicit states without samples.
- Saved cart metadata/prices refresh from the current catalog. Missing/inactive or
  insufficient-stock selections block checkout. Server preview/order creation still
  determines canonical totals.
- Chrome QA used a fresh isolated database: empty website/admin catalog; product
  entered via admin with image URL, custom category, AED 245.75 purchase price,
  AED 35.50 monthly rental and stock 4; published values verified; admin purchase
  edit to AED 299.25 appeared in an existing cart; rental edit to AED 42.75 appeared
  in rental detail; stock 0 disabled rental actions.
- Main local backend restarted successfully and applied migration V3.

## Web/admin completion — image uploads, service catalog and payments

- Added administrator-only product image upload with preview, PNG/JPEG/WebP support,
  a 5 MB limit, file-content checks, image dimension limits and database persistence.
  Public downloads use the detected image type, nosniff, immutable URLs and ETags.
- Added Admin → Service Catalog for adding and editing service codes, names,
  descriptions, base fees, VAT rates, working days, appointment hours/duration,
  advance-booking windows and activation. Public booking/home pages consume saved
  definitions. New defaults are AED 100 + 5% VAT = AED 105; historical booking
  amounts are preserved.
- Implemented Stripe-hosted service checkout, slot holds, overlap rejection across
  service types, expired-session release, verified payment callbacks and a secure
  return-page status lookup. Pending/failed payments never fabricate confirmation.
- A shared Stripe client provides timeouts, idempotency keys, signed raw-body
  webhook validation and timestamp checks. Both booking and order payments use
  `/api/orders/stripe/webhook`; amounts, currencies, references and paid status are
  checked before fulfillment. Duplicate callbacks do not duplicate notifications.
  Expired/cancelled online orders restore reserved stock. Unsupported standalone
  Samsung Pay/Tabby/Tamara/PayPal choices were removed from checkout.
- Added admin Stripe readiness status. Online payment UI remains unavailable when
  webhook setup is absent; offline orders and pending service requests remain usable.
- Upgrades remove the old service-type enum constraint and add defaults for existing
  booking payment/duration fields. An upgrade regression test preserves old amounts
  and verifies custom service codes.
- Browser verification used an isolated database: custom service creation through
  admin appeared on the customer page at AED 210 including VAT; a real existing PNG
  uploaded through the product form generated `/api/catalog/images/1` and a preview.
- Final main-app checks: backend started successfully, migrations V4–V6 applied,
  50 active products retained, 3 default services published at AED 105 incl. VAT.
- Verification: 62 backend tests, 12 frontend tests, production web build and backend
  package pass. No SMS, email or live card charge was sent.

Stripe implementation references: [Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment)
requires paid-status confirmation, and [webhook signature verification](https://docs.stripe.com/webhooks/signature)
uses the unchanged payload and endpoint signing secret.

### Employee and vendor registration (2026-10-30)
- Added public `/register/employee` and `/register/vendor` routes, preserving `/careers` and `/become-a-vendor` aliases.
- Forms submit their actual role; employee/vendor results explain pending admin approval and link to sign-in.
- Added registration choices on authentication pages and employee/vendor registration links in the shared website footer.
- Removed example company/contact/address values from registration forms; terms consent starts unchecked.
- Admin Users Management now shows both employee and vendor approval queues.
- Verified both role pages in the local browser. Backend: 63 tests passed, including public deep links and registration → pending → approval → login. Frontend: 12 tests passed; production build passed.

### Registration layout and home page navigation follow-up
- Fixed auth body flex direction so account-type navigation sits above the centered form rather than shrinking it into a right-hand column.
- Shortened signup tabs, added consistent introduction styles, and made mobile registration show the form without the tall promotional panel.
- Removed unimplemented social registration buttons from signup.
- Added Employee Registration and Vendor Registration navigation directly below the homepage header.
- Verified desktop (1080px centered form, navigation above form, no horizontal overflow) and 390px phone layout in browser; production frontend build passed.
- Deployed release `/opt/wefyx/releases/20261030-registration-ui-v1`; verified live homepage link opens updated vendor form. Product catalog unchanged.

### Simplified signup/login choices
- Removed the account-type navigation and customer registration wording.
- Main pages use Sign Up and Login, with Employee Registration and Vendor Registration links inside each card below the form.
- Role registration pages link back to the standard signup page; Login and Sign Up switches use canonical routes to avoid retaining an unintended registration role.
- Removed inactive social login buttons from the login screen.
- Production build passed. Verified live `/login` → `/register`, both role links, and absence of the customer registration label.
- Deployed `/opt/wefyx/releases/20261030-signup-flow-v1`; product catalog preserved.

### Customer-only website login; staff use Admin Login
- Website password and OTP login use customer-only endpoints that reject employee, vendor, and administrator accounts.
- Admin Login accepts SUPER_ADMIN, EMPLOYEE, and VENDOR, preserving each role and directing employees/vendors to `/admin/portal`.
- Staff sessions use admin session storage; field-task requests use the corresponding staff token. Legacy `/portal` links redirect into the admin workspace.
- Employee/vendor registration login links and pending-registration success buttons lead to Admin Login.
- 64 backend tests and 12 frontend tests passed, including customer/staff password boundaries, OTP boundaries and existing role restrictions; production build passed.
- Deployed `/opt/wefyx/releases/20261030-staff-login-v1`; catalog unchanged. Live browser sign-ins verified Employee Operations and Vendor Operations using demo accounts; signed out after verification.
