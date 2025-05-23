FROM node:18-alpine AS build

WORKDIR /app

# Copy from health-track-frontend subdirectory
COPY health-track-frontend/package.json ./
COPY health-track-frontend/package-lock.json ./

RUN npm install

# Copy the rest of the app
COPY health-track-frontend/ ./

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]