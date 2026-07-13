FROM node:18-alpine
WORKDIR /app
COPY dns/package*.json ./
RUN npm install
COPY prisma ./prisma/
RUN npx prisma generate
COPY dns ./
COPY blocklists /app/blocklists
RUN npx tsc
CMD ["node", "dist/server.js"]
