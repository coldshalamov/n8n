FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json ./
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile
COPY --from=build /app/dist ./dist
EXPOSE 10000
CMD ["node", "dist/index.js"]
