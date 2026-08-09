FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Se instalan todas las dependencias (incluidas las de desarrollo) porque las
# migraciones corren vía ts-node al iniciar el contenedor (ver "migration:run"
# en package.json) — los archivos de migración compilados a .js no funcionan
# solos por un import de solo-tipos que TypeScript no elimina en este build.
#
# sqlite3 se recompila desde el código fuente: el binario precompilado que
# npm descarga por defecto quedó linkeado contra una versión de glibc más
# nueva que la de esta imagen y falla al cargar en runtime (ERR_DLOPEN_FAILED).
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci && npm rebuild sqlite3 --build-from-source

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3001

CMD ["sh", "-c", "npm run migration:run && node dist/main.js"]
