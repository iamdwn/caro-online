# build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY . .

ARG REACT_APP_API_BASE_URL

ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV GENERATE_SOURCEMAP=false

RUN npm install
RUN npm run build

# production stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
