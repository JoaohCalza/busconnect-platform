FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    unzip \
    libpq-dev \
    libxml2-dev \
    && docker-php-ext-install \
    pdo \
    pdo_pgsql \
    xml \
    dom

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# copia dependências
COPY composer.json composer.lock ./

# instala SEM rodar scripts (ESSENCIAL)
RUN composer install --no-scripts

# agora copia o resto do projeto
COPY . .

# agora sim roda scripts corretamente
RUN composer dump-autoload

RUN chmod -R 777 storage bootstrap/cache

EXPOSE 8000

# migrate --force aplica todas as migrations incluindo as do Sanctum
CMD sh -c "sleep 10 && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"