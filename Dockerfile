# Usar la imagen oficial de Node.js 22 basada en Alpine Linux (versión ligera)
FROM node:22-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos de definición de dependencias
COPY package*.json ./

# Instalar dependencias
# Usamos npm ci para una instalación limpia y determinista más rápida
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación (Vite -> dist)
RUN npm run build

# Exponer el puerto que usa el servidor (3005 según server.js)
EXPOSE 3005

# Comando para iniciar la aplicación en producción
# Ejecuta 'node server.js' que sirve tanto el backend (Socket.io/PeerJS) como el frontend estático
CMD ["npm", "run", "server"]
