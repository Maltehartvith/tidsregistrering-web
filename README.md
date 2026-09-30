# DISPUK Timeregnskab — Web

Vite + React + TypeScript + Tailwind PWA frontend.

## Local setup

```bash
npm install
npm run dev       # http://localhost:5173 (proxies /api → :4000)
```

For production builds against a remote API:

```bash
# .env / Railway build variable
VITE_API_URL=https://YOUR-API.up.railway.app/api
npm run build
```

## Railway (static)

- Build: `npm install && npm run build`
- Publish: `dist`
- Build-time var: `VITE_API_URL`
