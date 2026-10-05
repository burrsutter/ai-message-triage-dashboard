FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /opt/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js ./
COPY public ./public

# OpenShift assigns a random non-root UID whose primary group is 0.
RUN chgrp -R 0 /opt/app && chmod -R g=u /opt/app

EXPOSE 3000
USER 1001

CMD ["node", "server.js"]
