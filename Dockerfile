FROM node:16
WORKDIR /app

COPY . .

RUN npm install

EXPOSE 8081

CMD [ "node", "out/index.js" ]
