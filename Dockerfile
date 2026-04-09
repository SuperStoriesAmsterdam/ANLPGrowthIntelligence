FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js ./
COPY CT_Growth_Intelligence.html ./public/index.html
COPY js/ ./public/js/

EXPOSE 3000

CMD ["node", "server.js"]
