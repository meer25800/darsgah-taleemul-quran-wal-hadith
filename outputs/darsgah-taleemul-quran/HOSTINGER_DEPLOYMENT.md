# Hostinger VPS Deployment

The production architecture is:

- Nginx terminates HTTPS and proxies the public site.
- Next.js runs on `127.0.0.1:3000`.
- Express runs on `127.0.0.1:5000`.
- PM2 restarts both processes after failures and server reboots.
- MongoDB Atlas stores application records.
- Cloudinary stores persistent photos, books, syllabus files, and PDFs.

## Required access

Deployment cannot be completed without:

- a Hostinger VPS hostname or IP address;
- SSH access for a non-root deployment user;
- a domain managed in Hostinger DNS;
- MongoDB Atlas and Cloudinary production credentials.

Do not send passwords in chat. Add secrets directly to the server environment files.

## Server preparation

Install Ubuntu LTS, Node.js LTS, Nginx, PM2, Certbot, Git, UFW, Fail2ban, and MongoDB Database Tools. Create `/var/www/darsgahkongamdara` and give the deployment user ownership.

Allow only SSH, HTTP, and HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Environment files

Create `backend/.env` from `backend/.env.example`. Production values must include:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=
JWT_SECRET=
CLIENT_URL=https://YOUR_DOMAIN
CLIENT_URLS=https://YOUR_DOMAIN,https://www.YOUR_DOMAIN
PUBLIC_API_URL=https://YOUR_DOMAIN
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

Create `frontend-next/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://YOUR_DOMAIN/api
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
ISLAMIC_ASSISTANT_MINUTE_LIMIT=10
ISLAMIC_ASSISTANT_DAILY_LIMIT=50
```

## Nginx and SSL

Replace every `YOUR_DOMAIN` in `deploy/nginx/darsgahkongamdara.conf`, then:

```bash
sudo cp deploy/nginx/darsgahkongamdara.conf /etc/nginx/sites-available/darsgahkongamdara
sudo ln -s /etc/nginx/sites-available/darsgahkongamdara /etc/nginx/sites-enabled/darsgahkongamdara
sudo nginx -t
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
sudo systemctl reload nginx
```

## Deploy and restart

```bash
chmod +x deploy/scripts/deploy.sh deploy/scripts/backup-mongodb.sh
./deploy/scripts/deploy.sh
pm2 startup
pm2 save
```

Configure a root cron job for encrypted off-server backups. The provided script retains 14 days locally; local-only backups are not sufficient for disaster recovery.

## APK production URL

After the Hostinger URL is verified, replace `server.url` in `mobile/capacitor.config.json`, run `npm run sync`, then build and sign the Android release. Do not switch the APK before the Hostinger site and API pass production checks.

## Rollback

Keep the previous release in a separate directory or Git tag. To roll back, restore that revision, run the deploy script, and restore the MongoDB archive only if a database migration must also be reversed. Never run the seed script against production.
