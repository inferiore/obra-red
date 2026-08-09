FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# El frontend lee VITE_API_URL en tiempo de build (Vite lo incrusta en el
# bundle estático) — nginx.conf expone el backend bajo /api en el mismo
# origen, así que no hace falta configurar CORS ni URLs absolutas.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
