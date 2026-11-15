# 🌐 Domain Name & Nginx SSL Setup Guide (Step-by-Step)

This guide covers connecting your custom domain (purchased on **Name.com** or any registrar) to your AWS EC2 instance, configuring **Nginx reverse proxy**, and securing it with a free **Let's Encrypt SSL certificate (HTTPS)**.

---

## 📑 Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Step 1: Point Domain to EC2 (Name.com DNS)](#step-1-point-domain-to-ec2-namecom-dns)
3. [Step 2: Open HTTP (80) & HTTPS (443) in AWS](#step-2-open-http-80--https-443-in-aws)
4. [Step 3: Install Nginx & Certbot on EC2](#step-3-install-nginx--certbot-on-ec2)
5. [Step 4: Configure Nginx Reverse Proxy](#step-4-configure-nginx-reverse-proxy)
6. [Step 5: Obtain Free SSL Certificate (HTTPS)](#step-5-obtain-free-ssl-certificate-https)
7. [Step 6: Update Environment & Redeploy](#step-6-update-environment--redeploy)
8. [Verification & Maintenance](#verification--maintenance)

---

## 1. Overview & Architecture

Without Nginx, users must access ports directly (`:3000` for frontend, `:8080` for backend), which causes CORS issues and looks unprofessional.

With Nginx as a Reverse Proxy:
```text
User Browser
    │
    ▼ HTTPS (Port 443)
┌────────────────────────────────────────────────────────┐
│ EC2 Instance (54.253.77.235)                           │
│                                                        │
│  Nginx (SSL Termination & Routing)                     │
│    ├── location /api/  ──► http://127.0.0.1:8080 (API) │
│    └── location /      ──► http://127.0.0.1:3000 (Web) │
└────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Clean URL: `https://yourdomain.com` (no ports!)
- ✅ Free automatic SSL (Green padlock 🔒)
- ✅ **Zero CORS issues** (Frontend and API share the exact same domain)

---

## Step 1: Point Domain to EC2 (Name.com DNS)

1. Log in to [Name.com](https://www.name.com).
2. Go to **My Domains** → click on your domain name.
3. Click on **DNS Records** (or Manage DNS).
4. Add the following two **A Records**:

| Type | Host | Answer / IP Address | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `54.253.77.235` *(Your EC2 Public IP)* | 300 |
| **A** | `www` | `54.253.77.235` *(Your EC2 Public IP)* | 300 |

> ⏳ **Note:** DNS propagation can take 2–15 minutes.  
> You can verify from your local terminal:
> ```bash
> ping yourdomain.com
> ```
> When it returns your EC2 IP (`54.253.77.235`), proceed to Step 2.

---

## Step 2: Open HTTP (80) & HTTPS (443) in AWS

1. Open the [AWS EC2 Console](https://console.aws.amazon.com/ec2/).
2. Click **Instances** → select your EC2 instance.
3. Select the **Security** tab in the bottom panel.
4. Click on your **Security Group** ID (e.g. `sg-xxxxxxxx`).
5. Click **Edit inbound rules** and add these rules:

| Type | Protocol | Port Range | Source | Description |
| :--- | :--- | :--- | :--- | :--- |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Web HTTP & Let's Encrypt verification |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | Secure Web HTTPS |

6. Click **Save rules**.

---

## Step 3: Install Nginx & Certbot on EC2

SSH into your EC2 instance:
```bash
ssh -i ors-key.pem ubuntu@54.253.77.235
```

Install Nginx and Certbot:
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

Verify Nginx is running:
```bash
sudo systemctl status nginx
```

---

## Step 4: Configure Nginx Reverse Proxy

1. Create a new Nginx configuration file for your application:
   ```bash
   sudo nano /etc/nginx/sites-available/ors
   ```

2. Paste the following configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Backend API requests -> forward to Spring Boot container
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend web application -> forward to Next.js container
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Enable the site and test the configuration:
   ```bash
   # Enable our site
   sudo ln -sf /etc/nginx/sites-available/ors /etc/nginx/sites-enabled/

   # Remove default welcome site
   sudo rm -f /etc/nginx/sites-enabled/default

   # Test syntax (must say: syntax is ok, test is successful)
   sudo nginx -t

   # Reload Nginx
   sudo systemctl restart nginx
   ```

---

## Step 5: Obtain Free SSL Certificate (HTTPS)

Run Certbot to request a free SSL certificate from Let's Encrypt:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Prompts during setup:**
- **Email:** Enter your email address (for renewal notices).
- **Terms of Service:** Type `Y` and press Enter.
- **Share email:** Type `N` (optional).
- **HTTPS Redirect:** If prompted, choose `Redirect` (automatically redirects HTTP to HTTPS).

Certbot will automatically verify ownership through DNS and update your `/etc/nginx/sites-available/ors` file with SSL certificates!

---

## Step 6: Update Environment & Redeploy

Now that your site runs on `https://yourdomain.com`, update the frontend API base URL:

### 1. On your Local Mac:
Update `deploy/.env` and `.env`:
```env
NEXT_PUBLIC_BASE_API=https://yourdomain.com
```

Rebuild and push the Docker image:
```bash
./deploy/build-and-push.sh
```

### 2. On your EC2 Instance:
Update `~/ors-app/.env`:
```bash
nano ~/ors-app/.env
```
Set:
```env
NEXT_PUBLIC_BASE_API=https://yourdomain.com
```

Deploy the updated container:
```bash
cd ~/ors-app
./deploy-ec2.sh
```

---

## Verification & Maintenance

### Verify Access
Open your browser and navigate to:
- 🌐 **Frontend:** `https://yourdomain.com`
- 🛡️ **Admin Portal:** `https://yourdomain.com/admin`
- 💓 **Backend Health:** `https://yourdomain.com/api/v1/health`

### SSL Certificate Auto-Renewal
Let's Encrypt certificates are valid for 90 days. Certbot automatically sets up a renewal timer.

Test the auto-renewal process:
```bash
sudo certbot renew --dry-run
```
If it says `Congratulations, all simulated renewals succeeded`, your SSL will renew automatically in the background with zero maintenance required!
