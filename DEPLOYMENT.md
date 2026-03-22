# CampusConnect Deployment Guide

This guide will help you deploy the CampusConnect student social network platform on a VPS server.

## Prerequisites

- VPS with Ubuntu 20.04+ (recommended: 2GB RAM, 2 vCPUs)
- Domain name pointing to your VPS
- SSL certificate (Let's Encrypt recommended)

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│  Go API     │────▶│ PostgreSQL  │
│  (Reverse   │     │   (Port     │     │  (Port      │
│   Proxy)    │◄────│   8080)     │◄────│   5432)     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Redis    │
                    │  (Port      │
                    │   6379)     │
                    └─────────────┘
```

## Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx postgresql postgresql-contrib redis-server git curl

# Install Go
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
rm go1.21.5.linux-amd64.tar.gz

# Add Go to PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## Step 2: Database Setup

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER campusconnect WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE campusconnect OWNER campusconnect;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE campusconnect TO campusconnect;"

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Step 3: Backend Deployment

```bash
# Create app directory
sudo mkdir -p /var/www/campusconnect
sudo chown $USER:$USER /var/www/campusconnect

# Clone repository
cd /var/www/campusconnect
git clone <your-repo-url> .

# Build backend
cd backend
go mod download

# Create environment file
cat > .env << EOF
SERVER_PORT=8080
ENVIRONMENT=production

DB_HOST=localhost
DB_PORT=5432
DB_USER=campusconnect
DB_PASSWORD=your_secure_password
DB_NAME=campusconnect
DB_SSLMODE=disable

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_ACCESS_EXPIRY=60
JWT_REFRESH_EXPIRY=168

SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@your-domain.com
FROM_NAME=CampusConnect

AI_ENABLED=true
AI_THRESHOLD=0.7
EOF

# Build the application
go build -o server cmd/server/main.go

# Create systemd service
sudo tee /etc/systemd/system/campusconnect.service << EOF
[Unit]
Description=CampusConnect API Server
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/campusconnect/backend
ExecStart=/var/www/campusconnect/backend/server
Restart=on-failure
RestartSec=5
Environment=PATH=/usr/local/go/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl enable campusconnect
sudo systemctl start campusconnect
```

## Step 4: Frontend Deployment

```bash
# Build frontend
cd /var/www/campusconnect/frontend
npm install
npm run build

# Create production environment
cat > .env.production << EOF
VITE_API_URL=https://your-domain.com/api/v1
EOF

# Build with production settings
npm run build

# Set correct permissions
sudo chown -R www-data:www-data /var/www/campusconnect/frontend/dist
```

## Step 5: Nginx Configuration

```bash
# Copy Nginx config
sudo cp /var/www/campusconnect/backend/deploy/nginx.conf /etc/nginx/sites-available/campusconnect

# Update domain and SSL paths in config
sudo nano /etc/nginx/sites-available/campusconnect

# Enable site
sudo ln -s /etc/nginx/sites-available/campusconnect /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Step 7: Firewall Configuration

```bash
# Allow required ports
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | API server port | 8080 |
| `ENVIRONMENT` | Environment mode | development |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_USER` | PostgreSQL user | campusconnect |
| `DB_PASSWORD` | PostgreSQL password | - |
| `DB_NAME` | PostgreSQL database | campusconnect |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `JWT_SECRET` | JWT signing secret | - |
| `SENDGRID_API_KEY` | SendGrid API key | - |
| `FROM_EMAIL` | Sender email | noreply@campusconnect.edu |
| `AI_ENABLED` | Enable AI moderation | true |
| `AI_THRESHOLD` | Moderation threshold | 0.7 |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:8080/api/v1 |

## Monitoring & Logs

```bash
# View application logs
sudo journalctl -u campusconnect -f

# View Nginx logs
sudo tail -f /var/log/nginx/campusconnect_error.log

# View Nginx access logs
sudo tail -f /var/log/nginx/campusconnect_access.log
```

## Updating the Application

```bash
# Pull latest changes
cd /var/www/campusconnect
git pull

# Update backend
cd backend
go build -o server cmd/server/main.go
sudo systemctl restart campusconnect

# Update frontend
cd ../frontend
npm install
npm run build
```

## Backup & Restore

### Database Backup

```bash
# Create backup
sudo -u postgres pg_dump campusconnect > backup_$(date +%Y%m%d).sql

# Restore from backup
sudo -u postgres psql campusconnect < backup_YYYYMMDD.sql
```

## Troubleshooting

### Backend won't start

```bash
# Check logs
sudo journalctl -u campusconnect -n 100

# Verify database connection
sudo -u postgres psql -U campusconnect -d campusconnect -c "SELECT 1;"

# Check Redis connection
redis-cli ping
```

### Nginx errors

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Frontend not loading

```bash
# Check file permissions
ls -la /var/www/campusconnect/frontend/dist

# Verify Nginx root path
grep -r "root.*campusconnect" /etc/nginx/sites-enabled/
```

## Security Recommendations

1. **Change default passwords** - Update all default passwords
2. **Enable firewall** - Use UFW to restrict access
3. **Regular updates** - Keep system packages updated
4. **SSL/TLS** - Always use HTTPS in production
5. **Rate limiting** - Nginx config includes basic rate limiting
6. **Database security** - Use strong passwords, limit connections
7. **JWT secret** - Use a long, random secret key
8. **File permissions** - Restrict access to sensitive files

## Support

For issues and feature requests, please create an issue in the repository.
