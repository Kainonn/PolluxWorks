# 1. Instalar dependencias de UI
npm install @radix-ui/react-progress @radix-ui/react-tabs

# 2. Correr migraciones
php artisan migrate

# 3. (Opcional) Sembrar datos de prueba
php artisan db:seed --class=TenantSeeder

# 4. Compilar assets
npm run build
