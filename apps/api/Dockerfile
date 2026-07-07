FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE ${PORT:-3001}

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode) })"

CMD ["sh", "-c", "npm run migrate:run && node dist/index.js"]
