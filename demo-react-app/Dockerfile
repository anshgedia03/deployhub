FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
# Install the 'serve' package globally
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
# The -s flag tells serve to route all unknown requests to index.html
CMD ["serve", "-s", "dist", "-l", "3000"]
