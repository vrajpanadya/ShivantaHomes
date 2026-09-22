# SHIVANTA HOMES — Full-Stack Website + Admin Panel

Production-ready full-stack project for the SHIVANTA HOMES township (Chavaj, Bharuch):

- **`/client`** — Public cinematic website + admin panel (React + Vite + TypeScript + GSAP + ScrollTrigger + Lenis + React Router + Axios + Recharts)
- **`/server`** — REST API + admin backend (Node.js + Express + TypeScript + MongoDB/Mongoose + JWT + bcrypt + Multer + Cloudinary)

> “SHIVANTA HOMES” — Spacious 3 BHK luxurious homes @ Chavaj, Bharuch.

---

## 1. Quick start (development)

```bash
# --- Server (terminal 1) ---
cd server
cp .env.example .env          # edit values as needed
npm install
npm run seed                  # creates first admin + verified content + media + brochure PDF
npm run dev                   # API on http://localhost:5000 (tsx watch)

# --- Client (terminal 2) ---
cd client
npm install
npm run dev                   # site on http://localhost:5173 (proxies /api and /media → :5000)
```

Open:

| URL | What |
|---|---|
| `http://localhost:5173/` | Cinematic public website |
| `http://localhost:5173/admin/login` | Admin login |
| `http://localhost:5173/admin/dashboard` | Admin dashboard (protected) |

**Default admin (dev only, change via env/seed):** the seed creates the first admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env` (defaults `admin@shivantahomes.com` / `Shivanta@123`). Credentials are **never** hardcoded in frontend code.

### Database

- Set `MONGODB_URI` to your **MongoDB Atlas** connection string for real persistence.
- If `MONGODB_URI` is empty, the server auto-starts a local `mongodb-memory-server` with a persistent `server/.mongodb-data` directory so dev data survives restarts. A console warning reminds you to set Atlas.
- **Sandbox / preview note:** WiredTiger pre-allocates ~300 MB of journal files in the data directory. In size-limited workspaces run a standalone `mongod` with a data path *outside* the project (e.g. `~/.cache/shivanta-mongo`) and start the API with `MONGODB_URI=mongodb://127.0.0.1:27017/shivanta_homes`:
  ```bash
  mkdir -p ~/.cache/shivanta-mongo
  mongod --dbpath ~/.cache/shivanta-mongo --port 27017 --bind_ip 127.0.0.1 --quiet &
  NODE_ENV=production MONGODB_URI=mongodb://127.0.0.1:27017/shivanta_homes node dist/index.js
  ```
  All site content is (re)seeded on boot, so a fresh data directory is never a problem.

### Media storage

- Set `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` to store uploads on **Cloudinary** (automatic `fetch_format=auto, quality=auto` + width-limit transformations).
- Without Cloudinary, uploads fall back to **optimized local storage** (`server/public/media`, images auto-resized/re-encoded with `sharp`) served at `/media/*`. Only URLs + metadata are stored in MongoDB in both modes.

### Email (optional)

Set `RESEND_API_KEY` + `EMAIL_FROM` to enable admin notification emails (new enquiry) and forgot-password reset emails. Without them, mails are logged to the server console so flows still work.

---

## 2. Production

```bash
# server
cd server && npm run build && npm run seed
NODE_ENV=production npm start        # serves API + built client from one origin

# client
cd client && npm run build           # outputs client/dist (served by the server in production)
```

In production (`NODE_ENV=production`) the Express server serves `client/dist` (with SPA fallback for `/admin/*` routes), enables secure HTTP-only cookies, and expects real `MONGODB_URI` + `JWT_SECRET`.

---

## 3. Environment (`server/.env.example`)

```
PORT=5000
NODE_ENV=development
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=2h
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ADMIN_EMAIL=admin@shivantahomes.com
ADMIN_PASSWORD=Shivanta@123
ADMIN_NAME=Site Administrator
EMAIL_FROM=
RESEND_API_KEY=
WHATSAPP_NUMBER=919104717214
```

Never commit `.env`. The client needs **no** secrets — it talks to same-origin `/api`.

---

## 4. Project structure

```
server/src
├── config/          env validation, db (Atlas or memory fallback)
├── models/          Admin, Enquiry, SiteVisit, Media, ActivityLog, content.ts
│                    (Hero, ProjectOverview, Residence, Amenity, GalleryItem,
│                     ProjectVideo, FloorPlan, Specification, ProjectLocation,
│                     Brochure, SiteSettings, SeoSettings)
├── middleware/      auth (JWT+cookie+roles), errorHandler, rateLimit, upload (MIME/size), validate (zod)
├── controllers/     auth, enquiries, siteVisits, dashboard, media, activity, content (factories)
├── routes/          /api/auth /api/enquiries /api/site-visits /api/media /api/dashboard
│                    /api/activity-logs + content modules (/api/hero … /api/seo)
├── services/        storage (Cloudinary/local), mailer (Resend), mediaUsage (delete protection)
├── utils/           ApiError, asyncHandler, pagination, csv, activity logger
└── seed/seed.ts     idempotent seed: admin, optimized assets, brochure PDF, verified content

client/src
├── lib/             api (axios + interceptors), auth context, toasts/confirm/modals,
│                    icons (inline SVG), public-data cache, lenis/gsap helper, fallbacks
├── components/      Navbar, Footer, EnquiryForm,
│                    Hero (+Hero.css: blueprint→photo reveal, letter entrance, scroll zoom),
│                    PhotoWall (+PhotoWall.css: scattered wall + Flip full-screen viewer)
└── pages/
    ├── Home.tsx     cinematic one-page site (hero, overview, residences, amenities,
    │                gallery+lightbox, videos, plans, specs, location, contact, SEO)
    └── admin/       Login/Reset, Layout (sidebar/topbar), Dashboard (charts),
                     Enquiries, SiteVisits (list+calendar), Media library,
                     cms.tsx (generic CRUD/reorder/active-toggle engine for all modules),
                     Activity, Profile
```

---

## 5. API overview

Public (no auth): `GET /api/hero|project-overview|residences|amenities|gallery|videos|floor-plans|specifications|location|brochure|settings|seo`, `POST /api/enquiries` (rate-limited, validated, de-duplicated).

Admin (JWT Bearer or HTTP-only cookie, role-guarded):

- `POST /api/auth/login|logout|forgot-password|reset-password|change-password`, `GET /api/auth/me`, `PUT /api/auth/profile`
- `GET/PATCH/DELETE /api/enquiries…`, `POST /api/enquiries/:id/notes`, `GET /api/enquiries/export` (CSV)
- `GET/POST/PATCH/DELETE /api/site-visits`
- `POST /api/media/upload` (multipart, multiple), `GET/PATCH/DELETE /api/media` (usage-protected deletes)
- Content CRUD: `GET /api/<module>/list`, `POST /api/<module>`, `PUT /api/<module>/:id`, `PUT /api/<module>/reorder`, `DELETE /api/<module>/:id`; singletons use `GET`+`PUT /api/<module>`
- `GET /api/dashboard/stats`, `GET /api/activity-logs`

Security: helmet (CSP tuned for maps/fonts/media), CORS allowlist, rate limiting (global + auth + enquiries), mongo sanitization, zod validation, bcrypt (12 rounds), JWT expiry, HTTP-only cookies, MIME/size validation, central error handler, production-safe error messages, activity logging without secrets.

---

## 6. Seed data policy

The seed only adds **verified** project information taken from the supplied assets: 12 amenities, the 3 BHK ground-floor plan with room dimensions, 20'×40' plot size, site address (Chavaj Chokdi, Opp. Dharm Nandan, Bharuch), phone/WhatsApp +91 9104717214, supplied renders/plans/poster as gallery media, and a generated brochure PDF. It never fabricates enquiries, reviews, prices, awards, landmarks or testimonials. Re-running the seed is safe (upserts, collections only filled when empty).

---

## 7. Testing performed

- ✅ Backend + frontend TypeScript builds pass with no errors/warnings
- ✅ Admin login / logout / protected routes / 401 redirect / token via cookie + Bearer
- ✅ Enquiry submission → appears in admin list + dashboard stats (validated, de-duplicated, rate-limited)
- ✅ Enquiry status updates, notes, CSV export, filters/search/pagination/sort
- ✅ Site-visit create/confirm/reschedule + list & calendar views
- ✅ Media upload (image optimized via sharp), copy URL, usage-protected delete (409 + force)
- ✅ Content CRUD for every module + drag-and-drop reorder + active toggles → live on public site
- ✅ Brochure PDF generated & downloadable; floor plan served
- ✅ Production mode: single origin serves site + admin + API + media; deep links (`/admin/enquiries`) work
