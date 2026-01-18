FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

ENV HTTP_MODE=true
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/app.js"]
