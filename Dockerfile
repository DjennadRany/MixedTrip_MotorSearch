FROM node:18-alpine

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install --production

# Copie des fichiers sources
COPY . .

# Construction de l'application TypeScript
RUN npm run build

# Exposition du port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "dist/index.js"] 