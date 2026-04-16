/**
 * Модуль интеллектуальной системы рекомендаций
 * для интернет-магазина "Лавка у Оливандера"
 */

class RecommendationService {
  /**
   * Получить популярные товары (по просмотрам и покупкам)
   */
  static getPopularProducts(products, orders, limit = 6) {
    // Подсчитаем популярность каждого товара
    const productScore = {};
    
    // Инициализируем счетчики
    products.forEach(product => {
      productScore[product.id] = {
        views: product.views || 0,
        purchases: 0,
        score: 0
      };
    });

    // Считаем покупки
    orders.forEach(order => {
      if (productScore[order.productId]) {
        productScore[order.productId].purchases += order.quantity;
      }
    });

    // Вычисляем общий score (популярность = просмотры * 0.3 + покупки * 0.7)
    Object.keys(productScore).forEach(productId => {
      const score = productScore[productId];
      score.score = (score.views || 0) * 0.3 + (score.purchases || 0) * 0.7;
    });

    // Сортируем и берем топ
    return products
      .sort((a, b) => (productScore[b.id]?.score || 0) - (productScore[a.id]?.score || 0))
      .slice(0, limit);
  }

  /**
   * Получить похожие товары (из той же категории с близкой ценой)
   */
  static getSimilarProducts(product, products, limit = 5) {
    const priceRange = product.price * 0.3; // 30% от цены

    return products
      .filter(p => 
        p.id !== product.id &&
        p.category === product.category &&
        Math.abs(p.price - product.price) <= priceRange
      )
      .sort((a, b) => b.stock - a.stock) // Приоритет товарам в наличии
      .slice(0, limit);
  }

  /**
   * Получить рекомендации на основе истории просмотров пользователя
   */
  static getPersonalRecommendations(userHistory, products, orders, limit = 6) {
    if (!userHistory || userHistory.length === 0) {
      return this.getPopularProducts(products, orders, limit);
    }

    // Найдем категории, которые смотрел пользователь
    const viewedCategories = {};
    userHistory.forEach(viewedProduct => {
      const product = products.find(p => p.id === viewedProduct);
      if (product) {
        viewedCategories[product.category] = (viewedCategories[product.category] || 0) + 1;
      }
    });

    // Сортируем категории по количеству просмотров
    const topCategories = Object.entries(viewedCategories)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // Из топ категорий берем товары, которые не смотрел пользователь
    const recommendedIds = new Set();
    const recommendations = [];

    topCategories.forEach(category => {
      products
        .filter(p => 
          p.category === category && 
          !userHistory.includes(p.id) &&
          !recommendedIds.has(p.id)
        )
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 3)
        .forEach(product => {
          recommendedIds.add(product.id);
          recommendations.push({
            product,
            reason: `Популярно в категории «${category}»`
          });
        });
    });

    return recommendations.slice(0, limit);
  }

  /**
   * Получить товары, которые часто покупаются вместе
   */
  static getFrequentlyBoughtTogether(productId, products, orders, limit = 4) {
    const coOccurrenceMap = {};
    
    // Найдем заказы, содержащие целевой товар
    const ordersWithProduct = orders.filter(order => order.productId === productId);
    
    if (ordersWithProduct.length === 0) {
      return this.getSimilarProducts(
        products.find(p => p.id === productId),
        products,
        limit
      );
    }

    // Найдем, какие товары покупали эти же люди
    const customerEmails = ordersWithProduct.map(o => o.email);
    
    orders.forEach(order => {
      if (customerEmails.includes(order.email) && order.productId !== productId) {
        coOccurrenceMap[order.productId] = (coOccurrenceMap[order.productId] || 0) + 1;
      }
    });

    // Сортируем по количеству совпадений
    return Object.entries(coOccurrenceMap)
      .sort((a, b) => b[1] - a[1])
      .map(([productId]) => products.find(p => p.id === parseInt(productId)))
      .filter(p => p !== undefined)
      .slice(0, limit);
  }

  /**
   * Получить рекомендации для различных мест размещения
   */
  static getHomeRecommendations(products, orders, userHistory, limit = 6) {
    return {
      popular: {
        title: '⭐ Популярные товары',
        description: 'Самые любимые предметы в нашей лавке',
        placement: 'home_popular',
        products: this.getPopularProducts(products, orders, limit),
        reason: 'Высокая популярность'
      },
      forYou: {
        title: '🎯 Рекомендации для вас',
        description: 'Подобрано специально на основе ваших интересов',
        placement: 'home_for_you',
        items: this.getPersonalRecommendations(userHistory, products, orders, limit),
        reason: 'На основе ваших интересов'
      },
      newArrivals: {
        title: '🆕 Новинки',
        description: 'Свежие поступления в Лавку',
        placement: 'home_new',
        products: products.slice(-limit).reverse(),
        reason: 'Последние поступления'
      }
    };
  }

  /**
   * Найти товары по схожести (используется в поиске)
   */
  static findSimilar(query, products, limit = 5) {
    const queryLower = query.toLowerCase();
    return products
      .filter(p => 
        p.name.toLowerCase().includes(queryLower) ||
        p.description.toLowerCase().includes(queryLower) ||
        p.category.toLowerCase().includes(queryLower)
      )
      .slice(0, limit);
  }

  /**
   * Логировать просмотр товара пользователем
   */
  static logProductView(productId, products) {
    const product = products.find(p => p.id === productId);
    if (product) {
      product.views = (product.views || 0) + 1;
      return product;
    }
    return null;
  }

  /**
   * Логировать добавление товара в корзину
   */
  static logAddToCart(productId, products, cart) {
    const product = products.find(p => p.id === productId);
    if (product) {
      product.cartAdds = (product.cartAdds || 0) + 1;
      return product;
    }
    return null;
  }
}

module.exports = RecommendationService;
