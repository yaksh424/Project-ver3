/**
 * Система рекомендаций для фронтенда
 * "Лавка у Оливандера"
 */

class RecommendationWidget {
  constructor(options = {}) {
    this.apiBase = options.apiBase || '/api/recommendations';
    this.userHistory = [];
    this.loadUserHistory();
  }

  /**
   * Загрузить историю просмотров из localStorage
   */
  loadUserHistory() {
    const stored = localStorage.getItem('wizardShopHistory');
    this.userHistory = stored ? JSON.parse(stored) : [];
  }

  /**
   * Сохранить историю просмотров
   */
  saveUserHistory() {
    localStorage.setItem('wizardShopHistory', JSON.stringify(this.userHistory.slice(-20))); // Последние 20
  }

  /**
   * Добавить в историю просмотров
   */
  trackView(productId) {
    if (!this.userHistory.includes(productId)) {
      this.userHistory.push(productId);
      this.saveUserHistory();
    }

    // Отправить на сервер для логирования
    fetch(`${this.apiBase}/track-view/${productId}`, { method: 'POST' })
      .catch(e => console.log('Ошибка при логировании просмотра:', e));
  }

  /**
   * Получить и отобразить популярные товары
   */
  async renderPopular(containerId, limit = 6) {
    try {
      const response = await fetch(`${this.apiBase}/popular?limit=${limit}`);
      const data = await response.json();
      this.renderProductsBlock(containerId, data);
    } catch (e) {
      console.error('Ошибка при загрузке популярных товаров:', e);
    }
  }

  /**
   * Получить и отобразить похожие товары
   */
  async renderSimilar(containerId, productId, limit = 5) {
    try {
      const response = await fetch(
        `${this.apiBase}/similar/${productId}?limit=${limit}`
      );
      const data = await response.json();
      this.renderProductsBlock(containerId, data);
    } catch (e) {
      console.error('Ошибка при загрузке похожих товаров:', e);
    }
  }

  /**
   * Получить и отобразить товары, покупаемые вместе
   */
  async renderTogether(containerId, productId, limit = 4) {
    try {
      const response = await fetch(
        `${this.apiBase}/together/${productId}?limit=${limit}`
      );
      const data = await response.json();
      this.renderProductsBlock(containerId, data);
    } catch (e) {
      console.error('Ошибка при загрузке товаров к покупке:', e);
    }
  }

  /**
   * Получить рекомендации для главной страницы
   */
  async renderHome(containerId, limit = 6) {
    try {
      const viewedProducts = this.userHistory.slice(-10);
      const params = new URLSearchParams({
        limit,
        viewedProducts: JSON.stringify(viewedProducts)
      });

      const response = await fetch(`${this.apiBase}/home?${params}`);
      const data = await response.json();

      const container = document.getElementById(containerId);
      if (!container) return;

      let html = '';

      // Популярные товары
      if (data.popular && data.popular.products) {
        html += this.createSection(
          data.popular.title,
          data.popular.description,
          data.popular.products
        );
      }

      // Рекомендации для вас
      if (data.forYou && data.forYou.items && data.forYou.items.length > 0) {
        html += this.createSectionWithReasons(
          data.forYou.title,
          data.forYou.description,
          data.forYou.items
        );
      }

      // Новинки
      if (data.newArrivals && data.newArrivals.products) {
        html += this.createSection(
          data.newArrivals.title,
          data.newArrivals.description,
          data.newArrivals.products
        );
      }

      container.innerHTML = html;
    } catch (e) {
      console.error('Ошибка при загрузке главных рекомендаций:', e);
    }
  }

  /**
   * Отобразить блок товаров
   */
  renderProductsBlock(containerId, blockData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = this.createSection(
      blockData.title,
      blockData.description,
      blockData.products
    );

    container.innerHTML = html;
  }

  /**
   * Создать HTML секции с товарами
   */
  createSection(title, description, products) {
    if (!products || products.length === 0) {
      return '';
    }

    const productsHtml = products
      .map(p => this.createProductCard(p))
      .join('');

    return `
      <div class="recommendation-section">
        <div class="section-header">
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
        <div class="products-grid">
          ${productsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Создать HTML секции с причинами рекомендаций
   */
  createSectionWithReasons(title, description, items) {
    if (!items || items.length === 0) {
      return '';
    }

    const productsHtml = items
      .filter(item => item && item.product) // Фильтруем невалидные items
      .map(({ product, reason }) => this.createProductCard(product, reason))
      .join('');

    return `
      <div class="recommendation-section">
        <div class="section-header">
          <h3>${title}</h3>
          <p>${description}</p>
        </div>
        <div class="products-grid">
          ${productsHtml}
        </div>
      </div>
    `;
  }

  /**
   * Создать карточку товара
   */
  createProductCard(product, reason = null) {
    const ratingStars = this.renderStars(product.rating || 0);
    const reasonBadge = reason
      ? `<div class="recommendation-reason">${reason}</div>`
      : '';
    
    const currentPath = window.location.pathname;
    const productUrl = currentPath.includes('/catalog/') 
      ? `./product.html?id=${product.id}`
      : `./catalog/product.html?id=${product.id}`;
    const fallbackImage = currentPath.includes('/catalog/')
      ? '../assets/img/wand1.svg'
      : './assets/img/wand1.svg';
    const imageSrc = product.image || fallbackImage;

    return `
      <div class="product-card" data-product-id="${product.id}">
        ${reasonBadge}
        <div class="product-image-wrapper">
          <img src="${imageSrc}" alt="${product.name}" class="product-image">
          ${product.stock <= 2 ? '<span class="low-stock-badge">Мало товара</span>' : ''}
        </div>
        <div class="product-info">
          <h4>${product.name}</h4>
          <p class="category">${product.category}</p>
          <p class="description">${product.description.substring(0, 60)}...</p>
          <div class="rating">${ratingStars} (${product.ratingCount || 0})</div>
          <div class="product-footer">
            <span class="price">${product.price} ₽</span>
            <button class="view-btn" onclick="window.location.href='${productUrl}'">
              Подробнее
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Рендерить звёзды рейтинга
   */
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    let stars = '⭐'.repeat(fullStars);

    if (hasHalf) {
      stars += '✨';
    }

    return stars || 'Нет оценок';
  }

  /**
   * Получить статистику рекомендаций
   */
  async getStats() {
    try {
      const response = await fetch(`${this.apiBase}/stats`);
      return await response.json();
    } catch (e) {
      console.error('Ошибка при получении статистики:', e);
      return null;
    }
  }
}

// Создаем глобальный экземпляр для использования на страницах
window.recommendationWidget = new RecommendationWidget();
console.log('✓ window.recommendationWidget инициализирован:', window.recommendationWidget);

// Автоматически отслеживаем просмотр товара, если есть ID в URL
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (productId) {
    window.recommendationWidget.trackView(parseInt(productId));
  }
});
