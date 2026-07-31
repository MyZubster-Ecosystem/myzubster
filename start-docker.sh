#!/bin/bash
set -e

# Carica le variabili d'ambiente
export $(grep -v '^#' .env.docker | xargs)

# Costruisci e avvia i container
docker-compose up -d --build

echo "✅ MyZubster Docker stack avviato!"
echo ""
echo "📍 Servizi disponibili:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3009"
echo "   AI Agent:  http://localhost:3002"
echo "   MongoDB:   mongodb://localhost:27017"
echo ""
echo "📋 Logs: docker-compose logs -f"
echo "🛑 Stop:  docker-compose down"
