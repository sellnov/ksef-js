# @sellnov/ksef-js

A modern, lightweight, and framework-agnostic JavaScript library for accessing the Polish National e-Invoice System (**KSeF**) API 2.0.

Built with **ES2025**, it follows a "no-bloat" philosophy, providing a surgical and performant interface to KSeF without unnecessary dependencies.

## Key Features

- **Simplified Authentication**: Automated high-level `login()` that handles MF public keys, challenges, and RSA-OAEP encryption (SHA-256) out of the box.
- **Modern Tech Stack**: Uses ES2025 features (Private Fields, Top-level Await support).
- **Minimal Dependencies**: Relies only on `axios` for transport and native `node:crypto`.
- **Intelligent Error Handling**: Automatic extraction of KSeF-specific error codes and descriptions from API responses.
- **Environment Toggle**: Easy switching between Production and Test environments.
- **Surgical API Design**: Organized into specialized managers (Invoices, Sessions, Certificates, Permissions).

## Installation

```bash
npm install @sellnov/ksef-js
```

## Quick Start (Token-based Authentication)

The easiest way to start is using your **NIP** and a **KSeF Token** generated in the portal. The library handles the complex encryption flow for you.

```javascript
import { KSeFClient } from '@sellnov/ksef-js';

const client = new KSeFClient({
    test: true,               // true for api-test, false for production
    nip: '5265877635',        // Your NIP
    ksefToken: 'YOUR_TOKEN'   // Token from KSeF portal
});

// Performs full authentication: fetches public keys, 
// handles challenge, encrypts token, and initializes session.
await client.login();

console.log('Successfully logged in!');

// Query metadata for invoices from the last 7 days
const invoices = await client.invoices.queryMetadata({
    subjectType: 'Subject1',
    dateRange: {
        dateType: 'Invoicing',
        from: '2026-03-01T00:00:00.000Z',
        to: '2026-03-07T23:59:59.999Z'
    }
});

console.log(`Found ${invoices.invoices.length} invoices.`);
```

## Architecture

The client is divided into managers based on KSeF API tags:

- `client.auth`: Low-level authentication (challenges, token redemption, refreshing).
- `client.invoices`: Querying, sending, and downloading invoices or exports.
- `client.sessions`: Managing active sessions and checking processing status.
- `client.certificates`: Managing MF public keys and certificate enrollments.
- `client.permissions`: Managing access rights for persons and entities.

## Advanced Usage

### Manual Token Management
If you already have an `accessToken`, you can provide it directly:

```javascript
const client = new KSeFClient({
    test: false,
    token: 'eyJhbGci...'
});
```

### Checking Session Status
```javascript
const session = await client.sessionStatus();
if (session && session.isCurrent) {
    console.log(`Active session: ${session.referenceNumber}`);
}
```

### Error Handling
The library automatically enhances standard Axios errors with KSeF-specific details:

```javascript
try {
    await client.invoices.queryMetadata({ /* invalid params */ });
} catch (error) {
    // Outputs: "KSeF [21405] Input validation error: Field 'subjectType' is required"
    console.error(error.message);
}
```

## Requirements

- **Node.js**: >= 22.0.0 (for ES2025 and native crypto support)
- **KSeF API**: v2.0

## License

MIT
