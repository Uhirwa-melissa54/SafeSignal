# SafeSignal

SafeSignal is a parental online safety system that protects children from harmful websites by routing their internet traffic through a custom DNS server. Parents control the system entirely via WhatsApp.

## Features
- **WhatsApp Bot**: Parents register, add children, and check status directly via WhatsApp (powered by Twilio).
- **SMS Verification**: Children receive a verification link via SMS (powered by Africa's Talking).
- **Custom DNS Server**: Filters out adult content, gambling, violence, malware, phishing, and social media domains.
- **WhatsApp Alerts**: Parents receive real-time alerts when a child attempts to access a blocked domain.

## Project Structure
- `backend/`: Express server handling the Twilio webhooks, Africa's Talking SMS, and verification HTML page.
- `dns/`: Custom Node.js UDP/TCP DNS server using `dns2`, checking domains against text blocklists.
- `prisma/`: PostgreSQL database schema.
- `blocklists/`: Text files containing domains to block for various categories.

## Setup Instructions

1. **Environment Variables**
   Create a `.env` file in the root directory (or use the environment variables defined in `docker-compose.yml`) with the following values:
   ```env
   DATABASE_URL=postgresql://root:password@postgres:5432/safesignal?schema=public
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ATS_USERNAME=your_africas_talking_username
   ATS_API_KEY=your_africas_talking_api_key
   FRONTEND_URL=http://localhost:3000
   ```

2. **Run with Docker Compose**
   The entire stack (PostgreSQL, Backend, DNS Server) can be started using Docker Compose.

   ```bash
   docker compose up --build
   ```

   This will:
   - Start the PostgreSQL database on port `5432`.
   - Build and start the Express backend on port `3000`.
   - Build and start the Custom DNS server on port `53` (UDP and TCP).

3. **Database Migration**
   On the first run, you need to push the Prisma schema to the database:
   ```bash
   docker exec -it safesignal_backend npx prisma db push
   ```

## Usage
- **Twilio Webhook**: Configure your Twilio WhatsApp Sandbox to point incoming messages to `http://<your-ngrok-url>:3000/whatsapp/webhook`.
- **Testing DNS**: 
  ```bash
  dig @localhost -p 53 xvideos.com
  ```
  It should return `0.0.0.0` if blocked. Allowed domains will be forwarded to Cloudflare (`1.1.1.1`).
