FROM node:latest

COPY package.json .
RUN npm install

COPY . .

USER node

CMD ["npm", "start"]
