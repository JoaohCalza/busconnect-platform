# Etapa 1: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install @mui/material @emotion/react @emotion/styled
COPY . .
RUN npm run build

# Etapa 2: servidor web
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]