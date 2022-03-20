FROM node:16.14.2-alpine
WORKDIR /app
COPY ./ ./
RUN npm install
CMD [ "npm", "start" ]
