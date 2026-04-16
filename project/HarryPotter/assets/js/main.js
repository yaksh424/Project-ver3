const API_BASE = 'http://localhost:3000/api';
const AUTH_TOKEN_KEY = 'shopToken';

function getAuthHeaders() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`);
    return await response.json();
  } catch (error) {
    console.error('Ошибка загрузки товаров:', error);
    return [];
  }
}

async function fetchProductById(id) {
  try {
    const response = await fetch(`${API_BASE}/products/${id}`);
    return await response.json();
  } catch (error) {
    console.error('Ошибка загрузки товара:', error);
    return null;
  }
}

async function loginUser(email, password) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Ошибка входа');
  }

  const data = await response.json();
  if (data.token) {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  }
  return data;
}

async function logoutUser() {
  await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    }
  }).catch(() => {});
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.location.href = '/index.html';
}

async function getUserProfile() {
  const response = await fetch(`${API_BASE}/me`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Неавторизован');
  }

  return await response.json();
}

async function fetchCart() {
  const response = await fetch(`${API_BASE}/cart`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Ошибка загрузки корзины');
  }

  return await response.json();
}

async function addToCart(productId, quantity = 1) {
  const response = await fetch(`${API_BASE}/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ product_id: productId, quantity })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      window.location.href = '/login.html';
      return;
    }
    throw new Error(error.error || 'Ошибка добавления в корзину');
  }

  const data = await response.json();
  alert('✅ Товар добавлен в корзину');
  return data;
}

async function updateCartItem(productId, quantity) {
  const response = await fetch(`${API_BASE}/cart/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ product_id: productId, quantity })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Ошибка обновления корзины');
  }

  return await response.json();
}

async function removeCartItem(productId) {
  const response = await fetch(`${API_BASE}/cart/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Ошибка удаления товара');
  }

  return await response.json();
}

async function checkoutCart() {
  const response = await fetch(`${API_BASE}/cart/checkout`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Ошибка оформления заказа');
  }

  return await response.json();
}

async function initAuthNavigation() {
  const navList = document.querySelector('.nav ul');
  if (!navList) return;

  const userNav = document.createElement('li');
  userNav.id = 'nav-user-state';

  try {
    const user = await getUserProfile();
    userNav.innerHTML = `<a href="/cart.html">Привет, ${user.name}</a>`;
  } catch {
    userNav.innerHTML = `<a href="/login.html">Войти</a>`;
  }

  if (!document.getElementById('nav-user-state')) {
    navList.appendChild(userNav);
  }
}

async function loadCartPage() {
  const cartContainer = document.getElementById('cartContainer');
  if (!cartContainer) return;

  try {
    const response = await fetchCart();
    const { cart, total } = response;

    if (!cart || cart.length === 0) {
      cartContainer.innerHTML = `<div class="cart-empty"><p>Ваша корзина пока пуста.</p><a class="btn btn-primary" href="/catalog/">Перейти в каталог</a></div>`;
      return;
    }

    const rows = cart.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.price} ₽</td>
        <td><input type="number" min="1" value="${item.quantity}" onchange="updateCartItem(${item.productId}, this.value).then(() => loadCartPage()).catch(alert)" /></td>
        <td>${item.price * item.quantity} ₽</td>
        <td><button class="btn btn-danger" onclick="removeCartItem(${item.productId}).then(() => loadCartPage()).catch(alert)">Удалить</button></td>
      </tr>
    `).join('');

    cartContainer.innerHTML = `
      <div class="cart-table-wrap">
        <table class="cart-table">
          <thead>
            <tr><th>Товар</th><th>Цена</th><th>Количество</th><th>Сумма</th><th></th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="cart-footer">
        <div class="cart-total">Итого: <strong>${total} ₽</strong></div>
        <button class="btn btn-primary" onclick="checkoutCart().then(data => { alert('✅ Заказ оформлен! Сумма: ' + data.total + ' ₽'); loadCartPage(); }).catch(err => alert(err.message || err));">Оформить заказ</button>
      </div>
    `;
  } catch (error) {
    if (error.message.includes('Неавторизован')) {
      window.location.href = '/login.html';
      return;
    }
    cartContainer.innerHTML = `<p class="error-text">${error.message}</p>`;
  }
}

// ==================== СОЗДАНИЕ БРОНИРОВАНИЯ ====================

async function createBooking(data) {
  try {
    const response = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Ошибка при создании бронирования');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Ошибка:', error);
    throw error;
  }
}

// ==================== СОЗДАНИЕ ЗАКАЗА ====================

async function createOrder(data) {
  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Ошибка при создании заказа');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Ошибка:', error);
    throw error;
  }
}

// ==================== РЕНДЕРИНГ КАТАЛОГА ====================

async function renderCatalog() {
  const products = await fetchProducts();
  const catalogGrid = document.querySelector('.catalog-grid');
  if (!catalogGrid) return;

  const fallbackPath = window.location.pathname.includes('/catalog/') ? '../assets/img/wand1.svg' : './assets/img/wand1.svg';
  catalogGrid.innerHTML = products.map(p => {
    const imageSrc = p.image || fallbackPath;
    return `
      <div class="card">
        <div class="product-img"><img src="${imageSrc}" alt="${p.name}" /></div>
        <h3>${p.name}</h3>
        <p class="muted">${p.category}</p>
        <p class="desc">${p.description}</p>
        <p class="price">${p.price} ₽</p>
        <a href="product.html?id=${p.id}" class="btn btn-primary">Подробнее</a>
      </div>
    `;
  }).join('');
}

// ==================== РЕНДЕРИНГ СТРАНИЦЫ МАШИНЫ ====================

async function renderProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) {
    document.body.innerHTML = '<p>Товар не найден</p>';
    return;
  }

  const product = await fetchProductById(id);
  if (!product) {
    document.body.innerHTML = '<p>Ошибка загрузки данных</p>';
    return;
  }

  const detail = document.querySelector('.product-detail');
  if (detail) {
    const detailImage = product.image || '../assets/img/wand1.svg';
    detail.innerHTML = `
      <div class="product-image"><img src="${detailImage}" alt="${product.name}" /></div>
      <div class="product-info">
        <h1>${product.name}</h1>
        <p class="muted">${product.category}</p>
        <p class="desc">${product.description}</p>
        <p class="price">${product.price} ₽</p>
        <p><strong>В наличии:</strong> ${product.stock}</p>

        <label>Количество: <input type="number" id="orderQty" value="1" min="1" max="${product.stock}" /></label>
        <div style="margin-top:1rem; display:flex; gap:0.75rem; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="addToCart(${product.id}, parseInt(document.getElementById('orderQty')?.value || '1'))">Добавить в корзину</button>
          <button class="btn btn-secondary" onclick="buyNow(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price})">Купить сейчас</button>
        </div>
      </div>
    `;
  }
}

// ==================== ФУНКЦИЯ ПОКУПКИ ====================

function buyNow(productId, name, price) {
  const qty = parseInt(document.getElementById('orderQty')?.value || '1');
  localStorage.setItem('selectedProduct', JSON.stringify({ id: productId, name, price, quantity: qty }));
  window.location.href = '../order/checkout.html';
}

// ==================== ОБРАБОТКА ФОРМЫ БРОНИРОВАНИЯ ====================

document.addEventListener('DOMContentLoaded', function() {
  initAuthNavigation().catch(() => {});

  // Форма авторизации
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.querySelector('input[name="email"]')?.value;
      const password = document.querySelector('input[name="password"]')?.value;

      try {
        await loginUser(email, password);
        window.location.href = '/cart.html';
      } catch (error) {
        alert('❌ ' + (error.message || 'Ошибка входа'));
      }
    });
  }

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      await logoutUser();
    });
  }

  // Форма бронирования услуги
  const bookingForm = document.querySelector('form[action*="booking"]');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = {
        name: document.querySelector('input[name="name"]')?.value,
        phone: document.querySelector('input[name="phone"]')?.value,
        email: document.querySelector('input[name="email"]')?.value,
        serviceType: document.querySelector('select[name="serviceType"]')?.value,
        date: document.querySelector('input[name="date"]')?.value,
        description: document.querySelector('textarea[name="description"]')?.value
      };

      try {
        const result = await createBooking(data);
        alert(`✅ Бронирование успешно создано! ID: ${result.booking.id}`);
        bookingForm.reset();
      } catch (error) {
        alert('❌ Ошибка при создании бронирования');
      }
    });
  }

  // Форма заказа
  const orderForm = document.querySelector('form[action*="order"]');
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const selected = JSON.parse(localStorage.getItem('selectedProduct') || '{}');

      const data = {
        name: document.querySelector('input[name="name"]')?.value,
        email: document.querySelector('input[name="email"]')?.value,
        phone: document.querySelector('input[name="phone"]')?.value,
        address: document.querySelector('input[name="address"]')?.value,
        productId: selected.id || null,
        quantity: selected.quantity || 1
      };

      try {
        const result = await createOrder(data);
        alert(`✅ Заказ успешно создан! ID: ${result.order.id}\nСумма: ${result.order.total} ₽`);
        localStorage.removeItem('selectedProduct');
        orderForm.reset();
        setTimeout(() => window.location.href = '../', 1500);
      } catch (error) {
        alert('❌ Ошибка при создании заказа: ' + (error.message || ''));
      }
    });
  }

  // Загрузка каталога
  if (document.querySelector('.catalog-grid')) {
    renderCatalog();
  }

  // Загрузка деталей товара
  if (document.querySelector('.product-detail')) {
    renderProductDetail();
  }

  // Загрузка корзины
  if (document.getElementById('cartContainer')) {
    loadCartPage();
  }
});
