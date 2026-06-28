FROM node:20-alpine

WORKDIR /app

# Pre-install dependencies to speed up first container startup.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

EXPOSE 3001 9229

CMD ["npm", "run", "dev"]
