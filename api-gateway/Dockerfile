FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# 1. Instalamos TODAS las dependencias (incluyendo tipos) para poder compilar
RUN npm install

COPY . .

# 2. Compilamos el código TS a JS
RUN npm run build

# 3. Limpiamos las dependencias de desarrollo para que la imagen no pese tanto
# Esto borrará los @types y tsc después de que ya no se necesiten
RUN npm prune --production

EXPOSE 4004

CMD ["npm", "start"]