# 📧 Email Quick Setup

## ⚡ 3-Minute Gmail Setup

### Step 1: Enable 2FA (2 minutes)

1. Go to: https://myaccount.google.com/security
2. Click **2-Step Verification**
3. Follow prompts to enable

### Step 2: Generate App Password (1 minute)

1. Go to: https://myaccount.google.com/apppasswords
2. Select:
   - **App**: Mail
   - **Device**: Other (Custom name)
   - Enter: `KnotEngine`
3. Click **Generate**
4. Copy the 16-character password

### Step 3: Update .env (30 seconds)

```bash
# In your .env file:
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="abcd-efgh-ijkl-mnop"
GMAIL_SMTP_HOST="smtp.gmail.com"
GMAIL_SMTP_PORT="587"
FROM_EMAIL="KnotEngine <your-email@gmail.com>"
```

### Step 4: Test

```bash
cd apps/api
pnpm dev
```

Look for:

```
✅ Gmail SMTP connection successful
```

---

## 🎯 Quick Test

Send yourself a test email:

```javascript
// In apps/api console or add test endpoint:
import { EmailService } from "./src/infra/email-service.js";

await EmailService.testConnection();
```

---

## ❓ Troubleshooting

**"Invalid credentials"**

- Remove spaces from app password
- Check GMAIL_USER matches exactly
- Ensure 2FA is enabled

**"Connection timeout"**

- Check firewall
- Try port 465 with secure: true
- Verify smtp.gmail.com is accessible

**"Less secure app access"**

- Use App Password (Step 2), not regular password
- App passwords bypass this requirement

---

**Full Guide:** [docs/GMAIL_SETUP.md](./GMAIL_SETUP.md)
