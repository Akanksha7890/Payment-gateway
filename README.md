# Payflow Store

A clean, responsive product storefront built for the **Developer Practical Task – API Integration & Razorpay**. Products are loaded from the supplied API, and each purchase follows the complete Razorpay order and server-side verification flow.

## Features

- Dynamic product list from `GET /products`
- Responsive product cards for desktop, tablet, and mobile
- Loading skeletons, empty state, retryable error state, and accessible status updates
- Razorpay Checkout opened from a per-product **Buy now** button
- Server-side order creation and payment verification through the supplied API
- Clear success, failure, and checkout-dismissed feedback
- Small Express server that serves the frontend and proxies API calls

## Requirements

- Node.js 18 or newer (native `fetch` is used by the Express server)
- npm
- Internet access for the supplied backend API and Razorpay Checkout

## Local setup

1. Clone the repository and open its directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file from the example:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env`.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

For a production-style start, use `npm start`.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Local Express server port |
| `API_BASE_URL` | `https://webangeltech.com/demo/developer_task` | Supplied products and payments API |

No Razorpay secret is stored in this frontend project. The public `key` required by Razorpay Checkout is returned by the supplied `/create-order` API. Signature verification remains on the backend, where the secret belongs.

## API integration flow

```text
Browser                  Express proxy                 Supplied API / Razorpay
   |                           |                                  |
   |-- GET /api/products ----->|-- GET /products ---------------->|
   |<----- product list -------|<---------------------------------|
   |                           |                                  |
   |-- product_id ------------>|-- POST /create-order ----------->|
   |<-- order_id, amount, key -|<---------------------------------|
   |                           |                                  |
   |-------------- Open Razorpay Checkout ----------------------->|
   |<---------- order_id, payment_id, signature -----------------|
   |                           |                                  |
   |-- payment fields -------->|-- POST /verify-payment --------->|
   |<----- verified result ----|<---------------------------------|
```

Important implementation details:

- The client sends only `product_id` when creating an order. The trusted product price is looked up by the backend.
- Product prices are displayed in rupees, while `/create-order` returns `amount` in paise. That integer is passed to Razorpay unchanged.
- A successful Razorpay callback is not treated as final proof of payment. All three returned fields are posted to `/verify-payment`; the UI shows success only after that API confirms the signature.
- The Express proxy keeps browser requests same-origin and centralizes the upstream API base URL and network error handling.

## Main project structure

```text
.
├── public/
│   ├── app.js          # Product loading and Razorpay flow
│   ├── index.html      # Storefront markup
│   └── styles.css      # Responsive interface
├── .env.example
├── package.json
├── server.js           # Static server and API proxy
└── README.md
```

## Deployment

Deploy to any Node.js host such as Render, Railway, Fly.io, or a VPS:

1. Set the build command to `npm install`.
2. Set the start command to `npm start`.
3. Set `API_BASE_URL` to the supplied API base URL.
4. Let the platform provide `PORT` (the server reads it automatically).

The final GitHub repository link and deployed URL can be added here after publishing:

- **Repository:** _add URL after pushing to GitHub_
- **Live frontend:** _add URL after deployment_

## Verification

Run syntax checks with:

```bash
npm run check
```
