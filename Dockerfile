ARG CODE_VERSION=16.14.2-alpine
FROM node:${CODE_VERSION}
LABEL maintainer="Valeriu Stinca <ts@strat.zone>"
LABEL version="0.0.1-beta"
LABEL vendor="Strategic Zone"
LABEL release-date="2022-03-23"

WORKDIR /app
COPY ./ ./
RUN npm install
EXPOSE 36000
CMD [ "npm", "start" ]
# ENTRYPOINT ["echo", "your command here!"]