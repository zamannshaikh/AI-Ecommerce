# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Run
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# Copy only the compiled code
COPY --from=builder /app/dist ./dist

# EXCLUDE this line:
# COPY .env .env 

EXPOSE 3000

CMD ["node", "dist/server.js"]