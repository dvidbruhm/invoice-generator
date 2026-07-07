FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont \
    postgresql postgresql-contrib su-exec

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm install --production

COPY . .
COPY runtipi/start.sh /start.sh
RUN chmod +x /start.sh

RUN mkdir -p /var/log && touch /var/log/postgresql.log \
    && chown postgres:postgres /var/log/postgresql.log \
    && mkdir -p /run/postgresql && chown postgres:postgres /run/postgresql

ENV PORT=3000
EXPOSE 3000

CMD ["/start.sh"]
