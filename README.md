<!-- README.md -->
# UCSM Digital Certificate Issuing & Verification Platform

npm install && npm run dev  →  client http://localhost:5173, API http://localhost:4000

First boot: generates an RSA-4096 signing keypair (private key AES-256-GCM-encrypted at rest),
creates the Argon2id admin from .env, and seeds template + sample certificate UCSM-2026-000001.

ASSETS: save the provided emblem as `client/public/assets/ucsm-emblem.png`
and the Rector signature as `client/public/assets/rector-signature.png`.
FONT: drop `Amoresa-Regular.woff2` into `client/public/fonts/` when licensed;
until then a clearly-marked placeholder (Great Vibes) is used via the same --font-script token.