FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

<<<<<<< HEAD
CMD ["npm", "run", "start"]
=======
CMD sh -c "npx prisma migrate deploy && npm run start"
>>>>>>> 51029d0f1d252d96ac3ce6899ab5a0044e9da102
