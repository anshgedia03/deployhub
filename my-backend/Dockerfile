FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json  ./

RUN npm ci 

COPY . .

RUN npm run build

#Production image

FROM node:22-alpine 

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
# Copy the .env file so the backend has its environment variables!
COPY .env ./

EXPOSE 3000

CMD ["node" , "dist/main.js"]