# Guía de Despliegue en VPS - GolManager

Esta guía te ayudará a desplegar GolManager en un VPS económico.

## Requisitos del VPS

- **Mínimo**: 2 CPU, 2GB RAM, 20GB SSD
- **Recomendado**: 2 CPU, 4GB RAM, 40GB SSD
- Sistema operativo: Ubuntu 22.04 LTS o Debian 12

### Proveedores económicos recomendados:
| Proveedor | Precio | Specs |
|-----------|--------|-------|
| Hetzner | €4.15/mes | 2 vCPU, 4GB RAM |
| Contabo | €4.99/mes | 4 vCPU, 8GB RAM |
| Netcup | €3.99/mes | 2 vCPU, 4GB RAM |
| OVH | €6.00/mes | 2 vCPU, 4GB RAM |

## Paso 1: Preparar el servidor

```bash
# Conectar al VPS
ssh root@tu-ip-servidor

# Actualizar el sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Crear usuario para la aplicación
adduser golmanager
usermod -aG docker golmanager
su - golmanager
```

## Paso 2: Clonar el proyecto

```bash
# Crear directorio
mkdir -p ~/apps
cd ~/apps

# Clonar tu repositorio (o subir archivos via SFTP)
git clone https://tu-repositorio/golmanager.git
cd golmanager
```

## Paso 3: Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores
nano .env
```

### Configuración mínima requerida:

```env
# Base de datos
POSTGRES_USER=golmanager
POSTGRES_PASSWORD=TuContraseñaSegura123!
POSTGRES_DB=golmanager

# Secreto de sesión (genera uno nuevo)
SESSION_SECRET=$(openssl rand -hex 32)

# Tu dominio
DOMAIN=golmanager.tudominio.com
```

## Paso 4: Configurar dominio

1. En tu proveedor de dominio, crear registro DNS:
   - Tipo: A
   - Nombre: golmanager (o @)
   - Valor: IP de tu VPS

2. Esperar propagación DNS (5-30 minutos)

## Paso 5: Configurar SSL

```bash
# Editar nginx.conf y reemplazar YOUR_DOMAIN con tu dominio real
nano nginx.conf

# Crear directorios para certificados
mkdir -p certbot/conf certbot/www

# Obtener certificado SSL (primera vez)
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d golmanager.tudominio.com \
  --email tu@email.com \
  --agree-tos --no-eff-email
```

## Paso 6: Construir e iniciar

```bash
# Construir la aplicación
docker compose build

# Iniciar todos los servicios
docker compose up -d

# Ver logs
docker compose logs -f app
```

## Paso 7: Migrar la base de datos

```bash
# Ejecutar migraciones
docker compose exec app npm run db:push

# O si tienes un dump de la base de datos actual:
cat backup.sql | docker compose exec -T db psql -U golmanager -d golmanager
```

## Paso 8: Verificar

Visita https://golmanager.tudominio.com

---

## Comandos útiles

```bash
# Ver estado de contenedores
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Reiniciar aplicación
docker compose restart app

# Parar todo
docker compose down

# Actualizar aplicación
git pull
docker compose build
docker compose up -d

# Backup de base de datos
docker compose exec db pg_dump -U golmanager golmanager > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup.sql | docker compose exec -T db psql -U golmanager -d golmanager
```

---

## Object Storage (Fotos y Logos)

### Opción A: Backblaze B2 (Recomendado - económico)

1. Crear cuenta en https://www.backblaze.com/b2
2. Crear bucket público
3. Obtener Application Key
4. Configurar en `.env`:

```env
S3_ENDPOINT=https://s3.us-west-001.backblazeb2.com
S3_ACCESS_KEY=tu_key_id
S3_SECRET_KEY=tu_application_key
S3_BUCKET=golmanager-assets
S3_REGION=us-west-001
```

### Opción B: Wasabi

Similar proceso, endpoint: `https://s3.wasabisys.com`

### Opción C: Almacenamiento local

Si prefieres guardar archivos localmente:

```yaml
# Agregar a docker-compose.yml en el servicio app:
volumes:
  - ./uploads:/app/uploads
```

---

## Migrar datos desde Replit

### 1. Exportar base de datos actual

En Replit, ejecutar:
```bash
pg_dump $DATABASE_URL > backup.sql
```

Descargar el archivo `backup.sql`

### 2. Exportar archivos de Object Storage

Descargar todos los archivos del bucket actual.

### 3. Importar en el nuevo servidor

```bash
# Copiar backup al servidor
scp backup.sql golmanager@tu-ip:~/apps/golmanager/

# Importar
docker compose exec -T db psql -U golmanager -d golmanager < backup.sql
```

---

## Monitoreo y Mantenimiento

### Logs automáticos
```bash
# Configurar rotación de logs
sudo nano /etc/logrotate.d/docker
```

```
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  size=10M
  missingok
}
```

### Renovación SSL automática
El contenedor `certbot` ya está configurado para renovar automáticamente cada 12 horas.

### Backups automáticos
```bash
# Crear script de backup
cat > ~/backup.sh << 'EOF'
#!/bin/bash
cd ~/apps/golmanager
docker compose exec -T db pg_dump -U golmanager golmanager | gzip > ~/backups/golmanager_$(date +%Y%m%d_%H%M%S).sql.gz
find ~/backups -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x ~/backup.sh

# Agregar a crontab (backup diario a las 3am)
crontab -e
# Agregar: 0 3 * * * /home/golmanager/backup.sh
```

---

## Solución de problemas

### Error de conexión a base de datos
```bash
docker compose logs db
docker compose exec db psql -U golmanager -d golmanager -c "SELECT 1"
```

### La app no inicia
```bash
docker compose logs app
docker compose exec app node -e "console.log(process.env.DATABASE_URL)"
```

### Certificado SSL no funciona
```bash
# Verificar que el dominio apunta al servidor
dig golmanager.tudominio.com

# Renovar manualmente
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot renew
```

---

## Costo mensual estimado

| Servicio | Costo |
|----------|-------|
| VPS Hetzner CX21 | €4.15 |
| Backblaze B2 (10GB) | ~$1 |
| Dominio (anual/12) | ~$1 |
| **Total** | **~$7-8/mes** |

---

## Soporte

Si tienes problemas con el despliegue, revisa:
1. Los logs: `docker compose logs -f`
2. El estado de los contenedores: `docker compose ps`
3. La conectividad de red: `curl localhost:5000`
