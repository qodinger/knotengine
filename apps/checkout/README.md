# 🛒 KnotEngine Checkout

The customer-facing payment interface for KnotEngine.

## ✨ Features

- **Dynamic QR Codes**: Supports BTC, LTC, and EVM-native assets.
- **Real-time Updates**: Instant payment detection via Socket.io.
- **Brandable**: Clean, cyberpunk-inspired UI that builds trust.
- **Responsive**: Fully optimized for mobile and desktop wallets.

## 🚀 Development

```bash
pnpm dev
```

The service runs on **Port 5051** by default.

## 🔗 Integration

The checkout page is invoked by KnotEngine API when an invoice is created. It expects an `invoiceId` in the URL:

`http://localhost:5051/checkout/[invoiceId]`
