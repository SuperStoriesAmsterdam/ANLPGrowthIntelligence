FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY server.js ./
COPY CT_Growth_Intelligence.html ./public/index.html
COPY js/ ./public/js/

RUN mkdir -p /data

EXPOSE 3000

CMD ["node", "server.js"]
