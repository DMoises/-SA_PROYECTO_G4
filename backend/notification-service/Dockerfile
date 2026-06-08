# =====================================================================
# notification-service | Dockerfile (multi-stage, Node/NestJS)
# =====================================================================

FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
# Cambiado a npm install para que no pida el lockfile obligatoriamente
RUN npm install
COPY . .
RUN npm run build

# ---------------------------------------------------------------------
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# Cambiado a npm install para producción
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY proto ./proto
EXPOSE 50054
CMD ["node", "dist/main.js"]