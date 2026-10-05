# Self-hosted DeskFit server on a SQLite file. Needs no Cloudflare account.
FROM node:22-slim AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY tsconfig.json schema.sql ./
COPY src ./src
RUN npm run build:node

FROM node:22-slim
WORKDIR /app
COPY --from=build /src/dist/node.mjs ./node.mjs
ENV DESKFIT_DB=/data/deskfit.sqlite HOST=0.0.0.0 PORT=8787 NODE_ENV=production
# The database lives in this folder; mount a volume the container user can write to.
VOLUME /data
EXPOSE 8787
USER node
CMD ["node", "--disable-warning=ExperimentalWarning", "node.mjs"]
