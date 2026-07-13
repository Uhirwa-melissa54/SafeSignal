FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY prisma ./prisma/
RUN npx prisma generate
COPY backend ./
RUN npx tsc
CMD ["node", "dist/index.js"]
