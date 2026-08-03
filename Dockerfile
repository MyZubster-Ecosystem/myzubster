FROM node:20-alpine

WORKDIR /app

# Copia i file delle dipendenze
COPY package*.json ./

# Installa le dipendenze (usa npm install invece di npm ci)
RUN npm install --only=production

# Copia il resto del codice
COPY . .

# Esponi la porta (cambia se necessario)
EXPOSE 10000

# Avvia l'applicazione
CMD ["node", "server.js"]
