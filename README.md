# Timeregnskab website

This is the website. It does not store the data itself. The API in `tidsregistrering.api` has to be running first, on port `4000`. The full setup, including Docker, the database, and the demo logins, is in that repository’s `README.md`.

You need [Node.js 20 or newer](https://nodejs.org/). Use the LTS installer. Open a new terminal after installing it.

## First time

Open a terminal. On a Mac that is the Terminal app, or **Terminal → New Terminal** in Cursor. On Windows it is PowerShell.

Go into this folder. Replace the path with the real one on this computer:

```bash
cd "/path/to/tidsregistrering-web"
npm install
npm run dev
```

`npm install` downloads the website’s libraries. You do this once, and again only after someone adds a library.

`npm run dev` starts the website. Leave the window open. When it is ready it prints:

```text
http://localhost:5173
```

Open that address in a browser. You should see the Timeregnskab login page. The site sends its calls to `http://localhost:4000`, which is the API. You do not set an API address for this local setup.

If the page loads but login fails, the API window is not running. Start that project first and wait until it says `Now listening on: http://localhost:4000`.

## The next day

The API has to be running. Then, in this folder:

```bash
npm run dev
```

Open `http://localhost:5173`.

To stop the website, click this terminal and press Ctrl+C.

## A built site on another host

When the website and the API are deployed separately, set `VITE_API_URL` before the build. It is the API address plus `/api`, for example `https://your-api.up.railway.app/api`. The value is copied into the site during `npm run build`. Changing it later does nothing until you build again.

On Railway, set `VITE_API_URL` in the web service’s variables, then redeploy so the build runs again. The build command is `npm install && npm run build`. Publish the `dist` folder.
