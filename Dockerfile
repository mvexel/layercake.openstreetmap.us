# The explorer as a static site served by Caddy at /explore/. The build args
# point it at a Layercake host other than data.openstreetmap.us.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_LAYERCAKE_DATA_URL
ARG VITE_LAYERCAKE_MAP_VIEW
ARG VITE_LAYERCAKE_SITE_URL
ARG VITE_LAYERCAKE_REPO_URL
ARG VITE_LAYERCAKE_UNOFFICIAL
ARG VITE_LAYERCAKE_UNOFFICIAL_DETAIL
RUN npm run build

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv/explore
