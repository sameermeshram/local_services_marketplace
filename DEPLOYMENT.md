# Production deployment guide

This project deploys as two services: a static React/Vite client from `client/` and an Express API from `server/`. The API connects to MongoDB and stores uploaded provider images and verification documents in Cloudinary. Email verification and password recovery use SMTP.

## Before choosing a host

- Use HTTPS for both services.
- Prefer same-site custom domains such as `app.example.com` for the client and `api.example.com` for the API. The API sets authentication cookies with `SameSite=Strict` in production; separate hosting-provider domains can prevent the browser from sending the refresh cookie. Supporting cross-site cookies requires a deliberate cookie and CSRF configuration change.
- Configure one exact client origin in `CLIENT_URL` (scheme and host, no path). The API CORS allowlist accepts that origin plus the two local Vite origins.
- Use a managed MongoDB deployment with backups enabled, a database user limited to this application's database, and network access restricted to the API host where possible. `MONGODB_URI` must include the database name.
- Create Cloudinary credentials for the deployment. Provider profile photos and verification documents require Cloudinary; uploads will fail without all three credentials.
- Configure a real SMTP account. Email verification and password reset cannot deliver production mail without it. Verify the sender domain with the mail provider before launch.

## Environment variables

Copy `server/.env.example` into the API host's secret/environment settings. Do not commit `.env` files or paste secrets into client variables.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Production | Set to `production` to enable secure, strict cookies and production proxy handling. |
| `PORT` | Host dependent | The API listens on this port; use the port supplied by the host. |
| `MONGODB_URI` | Yes | MongoDB connection URI including the application database name. |
| `JWT_ACCESS_SECRET` | Yes | Private signing secret, at least 32 characters. Generate a unique random value. |
| `JWT_REFRESH_SECRET` | Yes | Separate private signing secret, at least 32 characters. |
| `JWT_ACCESS_EXPIRES_IN` | No | Defaults to `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | No | Defaults to `7d`. |
| `CLIENT_URL` | Yes in deployment | Exact HTTPS client origin used for CORS and email verification links. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | Yes for production use | SMTP credentials. Port defaults to 587 if omitted; port 465 enables implicit TLS. |
| `EMAIL_FROM` | Recommended | Verified sender name/address. Defaults to a placeholder FixIt Local address. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Yes for uploads | Cloudinary storage for profile media and private verification documents. |
| `COOKIE_SECRET` | Optional | The current auth cookies are not signed, so this setting is not needed for the current auth flow. |

For the one-time admin seeder, provide these only to the seed job: `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD`, `ADMIN_PHONE`, and `ADMIN_PINCODE`. Use a unique strong password. The seeder resets the admin password to `ADMIN_PASSWORD` every time it runs, so do not rerun it casually and remove the seed-only password from the API service environment after the initial run.

For the client build, set `VITE_API_BASE_URL` to the public API URL ending in `/api`, for example `https://api.example.com/api`. Vite embeds this value into the built client; changing it requires a new client build. The localhost value in `client/.env.example` is for development only.

## Initial release sequence

1. Provision MongoDB, Cloudinary, SMTP, and the client/API domains. Set the server environment variables in the API host's secret manager.
2. From `server/`, install from the lockfile with `npm ci` and deploy with `npm start`. The server connects to MongoDB before opening its HTTP listener. `GET /api/health` is the health-check path.
3. Before accepting booking traffic, run `npm run indexes:bookings` from `server/` against the production MongoDB URI. This creates/verifies the active provider/date/time-slot unique index and supporting booking indexes. If it fails due to conflicting existing data or index options, stop and resolve the conflict; do not bypass the uniqueness constraint.
4. Run `npm run seed:categories` from `server/` to create the default service categories. Run `npm run seed:admin` once with the seed-only variables to create the first admin, then remove `ADMIN_PASSWORD` from the API environment.
5. Build the static client from `client/` with `npm ci` and `npm run build`, setting `VITE_API_BASE_URL` at build time. Publish the resulting `client/dist/` directory from a static host. Configure SPA fallback so application paths such as `/bookings` serve `index.html`.
6. Set `CLIENT_URL` to the deployed client origin and `VITE_API_BASE_URL` to the deployed API URL. Verify CORS, email verification, login/refresh/logout, provider uploads, booking creation, and the health endpoint over HTTPS before inviting users.

The repository currently has no host-specific deployment manifest or CI/CD workflow. Configure the commands and variables above in the chosen hosting provider rather than assuming a particular platform.

## Operational notes

- Keep MongoDB backups and test restore procedures before launch.
- Keep production secrets in the host's secret manager and rotate them there. Never use `VITE_` variables for secrets; they are public in browser bundles.
- The API has an existing `/api/health` endpoint. Since the server only listens after connecting to MongoDB, a successful health response also indicates that startup completed with a database connection.
- Booking index creation is an explicit release prerequisite. Do not depend on application auto-indexing to establish the active-slot uniqueness guarantee.
- Email delivery requires working SMTP credentials; development's Ethereal mail fallback is not available when `NODE_ENV=production`.
