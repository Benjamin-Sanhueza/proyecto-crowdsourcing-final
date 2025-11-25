FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json tsconfig.json ./
COPY src ./src
RUN npm ci
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
RUN mkdir -p /usr/src/app/uploads
EXPOSE 4000
CMD ["node","dist/server.js"]
