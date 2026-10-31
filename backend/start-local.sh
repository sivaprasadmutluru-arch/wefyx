#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"

if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi

# Local development: registration accepts any six-digit code without sending SMS.
export OTP_DEMO_BYPASS=true
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:4173,http://127.0.0.1:4173}"
exec mvn spring-boot:run -Dspring-boot.run.profiles=local-otp
