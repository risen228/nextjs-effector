## Architecture

- `src/shared/events` - exports `appStarted` for global usage

- `src/layouts/factories` - exports GIP/GSP/GSSP factories. Uses `appStarted` from `src/shared/events`

- `src/processes/*` - initiates application global logic. Uses `appStarted` from `src/shared/events`

- `src/pages/*` - declares pages views and models. Exports `pageStarted` for using with GIP/GSP/GSSP factories

- `pages/*` - declares Next.js pages. Uses GIP/GSP/GSSP factories from `src/layouts/factories` to bind `appStarted` and `pageStarted` to page
