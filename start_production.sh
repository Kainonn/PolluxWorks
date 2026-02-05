#!/bin/bash

# Script de inicio en modo producción
# Este script optimiza la aplicación Laravel y levanta los servidores

set -e  # Salir si hay algún error

echo "🚀 Iniciando aplicación en modo producción..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Limpiar cachés existentes
echo -e "${BLUE}📦 Limpiando cachés...${NC}"
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan clear-compiled
echo -e "${GREEN}✓ Cachés limpiadas${NC}"
echo ""

# 2. Optimizar Laravel para producción
# NOTA: No cachear config/routes en desarrollo local con artisan serve
# porque puede causar problemas con URLs y puertos
echo -e "${BLUE}⚡ Optimizando Laravel...${NC}"
# php artisan config:cache  # Desactivado para dev local
# php artisan route:cache   # Desactivado para dev local
php artisan view:cache
php artisan event:cache
# php artisan optimize      # Desactivado para dev local
echo -e "${GREEN}✓ Laravel optimizado${NC}"
echo ""

# 3. Generar rutas Ziggy/Wayfinder (si existe)
echo -e "${BLUE}🗺️  Generando rutas...${NC}"
if php artisan list | grep -q "ziggy:generate"; then
    php artisan ziggy:generate
    echo -e "${GREEN}✓ Rutas Ziggy generadas${NC}"
elif php artisan list | grep -q "wayfinder:generate"; then
    php artisan wayfinder:generate
    echo -e "${GREEN}✓ Rutas Wayfinder generadas${NC}"
else
    echo -e "${YELLOW}⚠ No se encontró generador de rutas (Ziggy/Wayfinder)${NC}"
fi
echo ""

# 4. Instalar dependencias de Node (si es necesario)
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📥 Instalando dependencias de Node...${NC}"
    npm ci --prefer-offline --no-audit
    echo -e "${GREEN}✓ Dependencias instaladas${NC}"
    echo ""
fi

# 5. Compilar assets para producción
echo -e "${BLUE}🏗️  Compilando assets...${NC}"
npm run build
echo -e "${GREEN}✓ Assets compilados${NC}"
echo ""

# 6. Migrar base de datos (opcional, descomenta si lo necesitas)
# echo -e "${BLUE}🗄️  Ejecutando migraciones...${NC}"
# php artisan migrate --force
# echo -e "${GREEN}✓ Migraciones ejecutadas${NC}"
# echo ""

# 7. Crear el archivo de indicador para producción
export APP_ENV=production
export APP_DEBUG=false

echo ""
echo -e "${GREEN}✅ Aplicación optimizada y lista para producción${NC}"
echo ""
echo -e "${BLUE}🌐 Levantando servidor...${NC}"
echo -e "${YELLOW}   La aplicación se ejecutará en modo producción${NC}"
echo -e "${YELLOW}   Presiona Ctrl+C para detener${NC}"
echo ""

# 8. Levantar el servidor PHP en modo producción
# Para producción real, deberías usar nginx/apache en lugar de artisan serve
# pero esto funciona para testing de producción local
# Usamos localhost para evitar problemas de CORS con subdominios
php artisan serve --host=localhost --port=8000 --env=production
