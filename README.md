# Better Auth Next.js Demo - Developer Guide

A comprehensive authentication system built with [Better Auth](https://better-auth.com) and [Next.js](https://nextjs.org), featuring advanced authentication patterns, social providers, and enterprise-grade security.

## 🚀 Quick Start

### Prerequisites

```bash
# Clone and setup
git clone https://github.com/better-auth/better-auth
cd better-auth/demo/nextjs
npm install

# Environment setup
cp .env.example .env
# Configure your environment variables (see Environment Variables section)

# Start development
npm run dev
```

Access the app at [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

Configure these in your `.env` file:

```env
# Core Configuration
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key

# Database
DATABASE_URL=your-mongodb-connection-string

# Social Providers
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_SENT_EMAIL=your-email@domain.com

# Stripe Integration
STRIPE_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRO_PRICE_ID=price_your-pro-plan-id
STRIPE_PLUS_PRICE_ID=price_your-plus-plan-id
```

## 🏗️ Authentication Architecture

### Core Configuration (`lib/auth.ts`)

The authentication system is configured in `lib/auth.ts` with the following components:

#### Database Adapter
```typescript
database: prismaAdapter(prisma, {
  provider: "mongodb",
})
```

#### Rate Limiting
```typescript
rateLimit: {
  enabled: true,
  window: 60, // seconds
  max: 100,   // requests per window
}
```

#### Account Linking
```typescript
account: {
  accountLinking: {
    trustedProviders: ["google", "github", "demo-app"],
  },
}
```

## 🔐 Authentication Features

### 1. Email & Password Authentication
- **Documentation**: [Email & Password Guide](https://www.better-auth.com/docs/basic-usage#email-password)
- **Features**: Registration, login, password reset
- **Email Templates**: Custom React email templates for password reset

### 2. Social Authentication
- **Current Providers**: GitHub, Google
- **Documentation**: [Social Providers](https://www.better-auth.com/docs/concepts/social-auth)
- **Account Linking**: Automatic linking of trusted providers

### 3. Passkeys (WebAuthn)
- **Documentation**: [Passkeys Plugin](https://www.better-auth.com/docs/plugins/passkey)
- **Features**: Passwordless authentication using biometrics/security keys

### 4. Multi-Factor Authentication (2FA)
- **Documentation**: [2FA Plugin](https://www.better-auth.com/docs/plugins/2fa)
- **Methods**: TOTP (Time-based One-Time Password), Email OTP
- **Issuer**: "Stack Provider Demo"

### 5. Organization Management
- **Documentation**: [Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- **Features**: Team creation, member invitations, role management
- **Email Invitations**: Custom React email templates

### 6. Admin & Permissions
- **Documentation**: [Admin Plugin](https://www.better-auth.com/docs/plugins/admin)
- **Features**: Admin user designation, role-based access control

### 7. Session Management
- **Documentation**: [Session Management](https://www.better-auth.com/docs/concepts/session-management)
- **Features**: Multi-session support, custom session data, secure cookies

### 8. Stripe Integration
- **Documentation**: [Stripe Plugin](https://www.better-auth.com/docs/plugins/stripe)
- **Features**: Subscription management, webhook handling, trial periods
- **Plans**: Plus ($X/month), Pro ($Y/month) with annual discounts

## 🌐 Adding New Social Providers

### Step 1: Install Provider Package (if needed)
```bash
npm install @auth/[provider-name]-provider
```

### Step 2: Add Provider Configuration

In `lib/auth.ts`, add to the `socialProviders` object:

```typescript
socialProviders: {
  // Existing providers
  github: { /* ... */ },
  google: { /* ... */ },
  
  // New provider examples
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID || "",
    clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID || "",
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || "",
    clientSecret: process.env.APPLE_CLIENT_SECRET || "",
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID || "",
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
  },
}
```

### Step 3: Update Environment Variables
Add the new provider credentials to your `.env` file:

```env
# Discord
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Twitter
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
```

### Step 4: Update Trusted Providers
Add new providers to the trusted providers list for account linking:

```typescript
account: {
  accountLinking: {
    trustedProviders: ["google", "github", "discord", "twitter"],
  },
}
```

### Supported Social Providers
- **Available**: GitHub, Google, Discord, Twitter, Facebook, Apple, Microsoft, LinkedIn, Spotify, Twitch
- **Documentation**: [All Social Providers](https://www.better-auth.com/docs/concepts/social-auth#supported-providers)

## 🛡️ Middleware & Security

### Authentication Middleware

The project includes custom middleware for request validation:

```typescript
hooks: {
  before: createAuthMiddleware(async (ctx) => {
    if (ctx.path !== '/sign-in/email') {
      return
    }
    
    const user = await prisma.user.findUnique({
      where: { email: ctx.body?.email }
    })
    
    if (!user) {
      throw new APIError('BAD_REQUEST', {
        message: 'No account found with this email address'
      })
    }
  })
}
```

### Security Features
- **Rate Limiting**: 100 requests per 60-second window
- **CSRF Protection**: Built-in CSRF token validation
- **Secure Cookies**: HttpOnly, Secure, SameSite configuration
- **Cross-Domain Cookies**: Production-ready subdomain support

### Cookie Configuration
```typescript
advanced: {
  cookiePrefix: "stackprovider-auth",
  crossSubDomainCookies: {
    enabled: process.env.NODE_ENV === "production",
    domain: cookieDomain,
  },
  cookies: {
    session_token: {
      name: "stackprovider-auth-token",
      attributes: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      }
    }
  }
}
```

## 📧 Email Configuration

### Email Service Setup (Resend)

The project uses [Resend](https://resend.com) for email delivery:

1. **Sign up** at [resend.com](https://resend.com)
2. **Get API key** from dashboard
3. **Add to environment**: `RESEND_API_KEY=your-key`
4. **Configure sender**: `RESEND_SENT_EMAIL=your-verified-domain@example.com`

### Email Templates

Custom React email templates are located in `lib/email/`:
- `invitation.tsx` - Organization invitations
- `reset-password.tsx` - Password reset emails
- `resend.ts` - Email service configuration

## 🔌 Advanced Plugins

### Device Authorization
```typescript
deviceAuthorization({
  expiresIn: "3min",
  interval: "5s",
})
```
**Use Case**: IoT devices, smart TVs, CLI applications
**Documentation**: [Device Authorization](https://www.better-auth.com/docs/plugins/device-authorization)

### OAuth Proxy
```typescript
oAuthProxy()
```
**Use Case**: Mobile apps, cross-origin authentication
**Documentation**: [OAuth Proxy](https://www.better-auth.com/docs/plugins/oauth-proxy)

### Bearer Token Authentication
```typescript
bearer()
```
**Use Case**: API authentication, mobile apps
**Documentation**: [Bearer Plugin](https://www.better-auth.com/docs/plugins/bearer)

### One Tap (Google)
```typescript
oneTap()
```
**Use Case**: Seamless Google sign-in experience
**Documentation**: [One Tap Plugin](https://www.better-auth.com/docs/plugins/one-tap)

## 📊 Monitoring & Analytics

### Last Login Method Tracking
```typescript
lastLoginMethod({
  cookieName: "stackprovider-auth-last-login-method",
})
```

### Custom Session Enhancement
```typescript
customSession(async (session) => {
  return {
    ...session,
    user: {
      ...session.user,
      customField: "value",
    },
  };
})
```

## 🚀 Deployment

### Vercel Deployment

The configuration automatically detects Vercel environment:

```typescript
const baseURL = process.env.VERCEL === "1"
  ? process.env.VERCEL_ENV === "production"
    ? process.env.BETTER_AUTH_URL
    : `https://${process.env.VERCEL_URL}`
  : undefined;
```

### Production Checklist

- [ ] Set `BETTER_AUTH_SECRET` to a secure random string
- [ ] Configure production database URL
- [ ] Set up custom domain for cookies
- [ ] Configure email service with verified domain
- [ ] Set up Stripe webhooks endpoint
- [ ] Enable rate limiting
- [ ] Configure CORS for your domain

## 📚 Documentation Links

### Core Documentation
- [Better Auth Docs](https://better-auth.com/docs) - Complete documentation
- [Getting Started](https://better-auth.com/docs/getting-started) - Basic setup
- [Configuration](https://better-auth.com/docs/configuration) - Advanced config

### Plugin Documentation
- [Social Providers](https://www.better-auth.com/docs/concepts/social-auth)
- [Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- [2FA Plugin](https://www.better-auth.com/docs/plugins/2fa)
- [Passkey Plugin](https://www.better-auth.com/docs/plugins/passkey)
- [Admin Plugin](https://www.better-auth.com/docs/plugins/admin)
- [Stripe Plugin](https://www.better-auth.com/docs/plugins/stripe)
- [Rate Limiting](https://www.better-auth.com/docs/concepts/rate-limit)
- [Session Management](https://www.better-auth.com/docs/concepts/session-management)
- [Email Configuration](https://www.better-auth.com/docs/concepts/email)

### Framework Integration
- [Next.js Integration](https://better-auth.com/docs/frameworks/nextjs)
- [React Hooks](https://better-auth.com/docs/frameworks/react)
- [API Routes](https://better-auth.com/docs/api-reference)

## 🤝 Contributing

Contributions welcome! Please read the [contributing guidelines](https://github.com/better-auth/better-auth/blob/main/CONTRIBUTING.md) and submit pull requests to the [main repository](https://github.com/better-auth/better-auth).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.