# Production setup (Vercel + Supabase + Postmark)

Set these in your Vercel Project Settings → Environment Variables (Production and Preview):

- NEXT_PUBLIC_SITE_URL = https://your-domain.tld
- NEXT_PUBLIC_SUPABASE_URL = https://<project-ref>.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY = <anon key>
- SUPABASE_SERVICE_ROLE_KEY = <service role key>  (Server/Encrypted)

Supabase → Authentication → URL Configuration:
- Site URL: https://your-domain.tld
- Redirect URLs: add each on a new line
  - https://your-domain.tld/auth/callback
  - https://your-domain.tld/auth/change-email
  - https://your-domain.tld/auth/reset-password

Supabase → Authentication → Email (SMTP):
- Provider: Custom SMTP (Postmark)
- Host: smtp.postmarkapp.com
- Port: 587
- Username: <POSTMARK_SERVER_TOKEN>
- Password: <POSTMARK_SERVER_TOKEN>
- Secure: TLS
- Sender: no-reply@your-domain.tld (must be verified in Postmark)
- Ensure “Email Confirmations” are enabled for Email Change

Postmark:
- Create a Server and get the Server Token
- Verify the From domain or sender signature you’ll use

Why this matters:
- We now build email redirect links with NEXT_PUBLIC_SITE_URL. Without the correct domain, Supabase may reject or generate wrong links. If SMTP isn’t configured, no emails will be sent and Postmark will show no activity.

Testing after deploy:
1) Change email in /account with a new address on your domain.
2) You should see a confirmation email from Postmark.
3) The link should hit https://your-domain.tld/auth/change-email and then redirect to /dashboard.

Troubleshooting:
- If still no emails, double-check SMTP creds and that the From email is verified in Postmark.
- Check Supabase Auth logs (Auth → Logs) for “smtp” errors.
- Confirm the Site URL matches exactly (protocol + domain).
