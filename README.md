# EightInch - 1inch Taker and Relayer API

This Express application provides APIs for interacting with 1inch Fusion+ protocol as both a taker and relayer.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
NODE_ENV=development
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Taker API (`/taker`)

- `GET /taker/orders` - Get active orders
- `POST /taker/orders` - Create new order
- `GET /taker/orders/:orderId` - Get order status

### Relayer API (`/relayer`)

- `GET /relayer/orders` - Get available orders to relay
- `POST /relayer/relay` - Submit relay transaction
- `GET /relayer/status/:relayId` - Get relay status

## Development

The application uses:
- Express.js for the web server
- CORS for cross-origin requests
- Morgan for request logging
- dotenv for environment variables

## License

MIT 