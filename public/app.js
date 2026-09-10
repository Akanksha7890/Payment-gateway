const productGrid = document.querySelector('#product-grid');
const catalogMessage = document.querySelector('#catalog-message');
const catalogMessageTitle = document.querySelector('#catalog-message-title');
const catalogMessageCopy = document.querySelector('#catalog-message-copy');
const retryButton = document.querySelector('#retry-button');
const productsStatus = document.querySelector('#products-status');
const toast = document.querySelector('#toast');
const toastMessage = document.querySelector('#toast-message');
const toastClose = document.querySelector('#toast-close');
const resultModal = document.querySelector('#result-modal');
const resultClose = document.querySelector('#result-close');
const paymentReference = document.querySelector('#payment-reference');
const paymentId = document.querySelector('#payment-id');

const palettes = [
  ['#dcefe7', '#2b7665'],
  ['#f4ded6', '#b95843'],
  ['#e7e2f4', '#675494'],
  ['#f3e9c9', '#887328'],
  ['#dbe9f3', '#396b8d'],
  ['#e8e8dd', '#596359'],
];

let toastTimer;
let activeButton = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatPrice(value) {
  const amount = Number(value);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function initials(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] || '')
    .join('')
    .toUpperCase();
}

async function apiRequest(url, options) {
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new Error('Please check your internet connection and try again.');
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error('The server returned an unexpected response.');
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'Something went wrong. Please try again.');
  }

  return payload;
}

function createProductCard(product, index) {
  const [background, color] = palettes[index % palettes.length];
  const article = document.createElement('article');
  article.className = 'product-card';
  article.innerHTML = `
    <div class="product-art" style="--art-bg: ${background}; --art-ink: ${color}">
      <span class="product-monogram" aria-hidden="true">${escapeHtml(initials(product.name))}</span>
    </div>
    <div class="product-info">
      <div class="product-topline">
        <h3>${escapeHtml(product.name)}</h3>
        <span class="product-price">${escapeHtml(formatPrice(product.price))}</span>
      </div>
      <p class="product-description">${escapeHtml(product.description)}</p>
      <button class="buy-button" type="button" data-product-id="${Number(product.id)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V7a5 5 0 0 1 10 0v2M5 9h14l-1 12H6L5 9Z" /></svg>
        <span>Buy now</span>
      </button>
    </div>`;

  article.querySelector('.buy-button').addEventListener('click', (event) => {
    beginCheckout(product, event.currentTarget);
  });

  return article;
}

function showCatalogMessage(title, copy, canRetry = true) {
  productGrid.replaceChildren();
  productGrid.hidden = true;
  catalogMessageTitle.textContent = title;
  catalogMessageCopy.textContent = copy;
  retryButton.hidden = !canRetry;
  catalogMessage.hidden = false;
}

async function loadProducts() {
  productGrid.hidden = false;
  catalogMessage.hidden = true;
  productGrid.setAttribute('aria-busy', 'true');
  productsStatus.textContent = 'Loading products.';

  try {
    const response = await apiRequest('/api/products');
    const products = Array.isArray(response.data) ? response.data : [];

    if (products.length === 0) {
      showCatalogMessage(
        'The collection is taking a breather.',
        'There are no products available right now. Please check back soon.',
        false,
      );
      productsStatus.textContent = 'No products are currently available.';
      return;
    }

    const cards = products.map(createProductCard);
    productGrid.replaceChildren(...cards);
    productsStatus.textContent = `${products.length} product${products.length === 1 ? '' : 's'} loaded.`;
  } catch (error) {
    showCatalogMessage(
      'We couldn’t load the collection.',
      error.message || 'Please check your connection and try again.',
    );
    productsStatus.textContent = 'Products could not be loaded.';
  } finally {
    productGrid.setAttribute('aria-busy', 'false');
  }
}

function setButtonLoading(button, loading) {
  if (!button) return;
  button.disabled = loading;
  button.innerHTML = loading
    ? '<span class="button-spinner" aria-hidden="true"></span><span>Preparing checkout…</span>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V7a5 5 0 0 1 10 0v2M5 9h14l-1 12H6L5 9Z" /></svg><span>Buy now</span>';
}

function showToast(message) {
  clearTimeout(toastTimer);
  toastMessage.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 6500);
}

function openResultModal(result) {
  paymentId.textContent = result?.payment_id || '';
  paymentReference.hidden = !result?.payment_id;
  resultModal.hidden = false;
  document.body.style.overflow = 'hidden';
  resultClose.focus();
}

function closeResultModal() {
  resultModal.hidden = true;
  document.body.style.overflow = '';
}

async function verifyPayment(payment) {
  productsStatus.textContent = 'Verifying your payment.';

  try {
    const response = await apiRequest('/api/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      }),
    });

    productsStatus.textContent = 'Payment verified successfully.';
    openResultModal(response.data);
  } catch (error) {
    productsStatus.textContent = 'Payment verification failed.';
    showToast(`Payment could not be verified. ${error.message}`);
  } finally {
    setButtonLoading(activeButton, false);
    activeButton = null;
  }
}

async function beginCheckout(product, button) {
  if (activeButton) return;

  activeButton = button;
  setButtonLoading(button, true);
  productsStatus.textContent = `Creating an order for ${product.name}.`;

  try {
    if (typeof window.Razorpay !== 'function') {
      throw new Error('Secure checkout did not load. Please refresh and try again.');
    }

    const response = await apiRequest('/api/create-order', {
      method: 'POST',
      body: JSON.stringify({ product_id: Number(product.id) }),
    });
    const order = response.data;

    if (!order?.order_id || !order?.key || !Number.isInteger(Number(order?.amount))) {
      throw new Error('The order details were incomplete. Please try again.');
    }

    const checkout = new window.Razorpay({
      key: order.key,
      amount: Number(order.amount),
      currency: order.currency || 'INR',
      name: 'Payflow',
      description: order.product?.name || product.name,
      order_id: order.order_id,
      handler: verifyPayment,
      modal: {
        ondismiss: () => {
          setButtonLoading(activeButton, false);
          activeButton = null;
          productsStatus.textContent = 'Checkout closed. No payment was made.';
        },
      },
      theme: { color: '#18332f' },
    });

    checkout.on('payment.failed', (event) => {
      const reason = event?.error?.description || 'The payment was not completed.';
      showToast(reason);
      setButtonLoading(activeButton, false);
      activeButton = null;
      productsStatus.textContent = 'Payment failed.';
    });

    checkout.open();
    productsStatus.textContent = 'Secure checkout opened.';
  } catch (error) {
    setButtonLoading(button, false);
    activeButton = null;
    productsStatus.textContent = 'Checkout could not be opened.';
    showToast(error.message || 'Unable to start checkout. Please try again.');
  }
}

retryButton.addEventListener('click', loadProducts);
toastClose.addEventListener('click', () => {
  clearTimeout(toastTimer);
  toast.hidden = true;
});
resultClose.addEventListener('click', closeResultModal);
resultModal.querySelector('.modal-backdrop').addEventListener('click', closeResultModal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !resultModal.hidden) closeResultModal();
});

document.querySelector('#year').textContent = new Date().getFullYear();
loadProducts();
