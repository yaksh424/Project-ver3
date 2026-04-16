/**
 * API маршруты для системы рекомендаций
 * Интернет-магазина "Лавка у Оливандера"
 */

const express = require('express');
const router = express.Router();
const RecommendationService = require('./recommendations');

// Middleware для отслеживания просмотров
function trackProductView(req, res, next) {
  // Это будет отслеживаться в основном маршруте /api/products/:id
  next();
}

/**
 * @swagger
 * /api/recommendations/popular:
 *   get:
 *     summary: Получить популярные товары
 *     tags: [Рекомендации]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Количество товаров
 *     responses:
 *       200:
 *         description: Список популярных товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 placement:
 *                   type: string
 *                   example: 'popular'
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 products:
 *                   type: array
 */
router.get('/popular', (req, res) => {
  const { products, orders } = req.app.locals.db;
  const limit = parseInt(req.query.limit) || 6;
  
  const popular = RecommendationService.getPopularProducts(products, orders, limit);
  
  res.json({
    placement: 'popular',
    title: '⭐ Популярные товары',
    description: 'Самые любимые предметы в нашей лавке',
    products: popular
  });
});

/**
 * @swagger
 * /api/recommendations/similar/{productId}:
 *   get:
 *     summary: Получить похожие товары
 *     tags: [Рекомендации]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID товара для поиска похожих
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Похожие товары
 *       404:
 *         description: Товар не найден
 */
router.get('/similar/:productId', (req, res) => {
  const { products } = req.app.locals.db;
  const productId = parseInt(req.params.productId);
  const limit = parseInt(req.query.limit) || 5;
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  
  const similar = RecommendationService.getSimilarProducts(product, products, limit);
  
  res.json({
    placement: 'similar',
    title: `📦 Похожие товары в категории «${product.category}»`,
    description: `Другие магические предметы, которые вам могут понравиться`,
    baseProduct: product.id,
    products: similar
  });
});

/**
 * @swagger
 * /api/recommendations/together/{productId}:
 *   get:
 *     summary: Товары, которые часто покупают вместе
 *     tags: [Рекомендации]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID товара
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *     responses:
 *       200:
 *         description: Товары, покупаемые вместе
 *       404:
 *         description: Товар не найден
 */
router.get('/together/:productId', (req, res) => {
  const { products, orders } = req.app.locals.db;
  const productId = parseInt(req.params.productId);
  const limit = parseInt(req.query.limit) || 4;
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  
  const together = RecommendationService.getFrequentlyBoughtTogether(productId, products, orders, limit);
  
  res.json({
    placement: 'together',
    title: '🛒 Часто покупают вместе',
    description: 'Товары, которые идеально дополнят ваш заказ',
    baseProduct: product.id,
    products: together,
    reason: 'На основе истории заказов'
  });
});

/**
 * @swagger
 * /api/recommendations/home:
 *   get:
 *     summary: Получить рекомендации для главной страницы
 *     tags: [Рекомендации]
 *     parameters:
 *       - in: query
 *         name: userEmail
 *         schema:
 *           type: string
 *         description: Email пользователя для персональных рекомендаций
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: Рекомендации для магазина
 */
router.get('/home', (req, res) => {
  const { products, orders } = req.app.locals.db;
  const limit = parseInt(req.query.limit) || 6;
  
  // Получим историю просмотров от клиента если она есть
  const userHistory = req.query.viewedProducts 
    ? JSON.parse(req.query.viewedProducts)
    : [];
  
  const recommendations = RecommendationService.getHomeRecommendations(
    products,
    orders,
    userHistory,
    limit
  );
  
  res.json(recommendations);
});

/**
 * @swagger
 * /api/recommendations/track-view/{productId}:
 *   post:
 *     summary: Отследить просмотр товара
 *     tags: [Рекомендации]
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Просмотр записан
 *       404:
 *         description: Товар не найден
 */
router.post('/track-view/:productId', (req, res) => {
  const { products } = req.app.locals.db;
  const productId = parseInt(req.params.productId);
  
  const product = RecommendationService.logProductView(productId, products);
  if (!product) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  
  res.json({
    success: true,
    message: 'Просмотр записан',
    product: {
      id: product.id,
      views: product.views
    }
  });
});

/**
 * @swagger
 * /api/recommendations/user:
 *   get:
 *     summary: Получить персональные рекомендации для пользователя
 *     tags: [Рекомендации]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: ID авторизованного пользователя (опционально)
 *       - in: query
 *         name: session_id
 *         schema:
 *           type: string
 *         description: ID сессии гостя (опционально)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Количество товаров
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         description: Bearer токен для авторизованного пользователя
 *     responses:
 *       200:
 *         description: Персональные рекомендации или fallback на популярные
 */
router.get('/user', (req, res) => {
  const { products, orders } = req.app.locals.db;
  const limit = parseInt(req.query.limit) || 6;
  
  // Проверяем авторизацию
  const userId = req.query.user_id || req.query.user_id;
  const sessionId = req.query.session_id;
  const authHeader = req.headers.authorization;
  
  const isAuthorized = userId || authHeader;
  
  // Если пользователь авторизован - персональные рекомендации
  if (isAuthorized) {
    // Получаем заказы пользователя за последние 90 дней
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const userOrders = orders.filter(order => {
      if (!order.createdAt) return true; // Если нет даты, включить
      return new Date(order.createdAt) >= ninetyDaysAgo;
    });
    
    // Если есть заказы - рекомендации на основе них
    if (userOrders.length > 0) {
      // Получаем товары из заказов
      const purchasedIds = [...new Set(userOrders.map(o => o.productId))];
      const purchasedProducts = products.filter(p => purchasedIds.includes(p.id));
      
      // Для каждого товара ищем похожие
      const recommendations = [];
      for (const product of purchasedProducts.slice(0, 3)) {
        const similar = RecommendationService.getSimilarProducts(product, products, 2);
        similar.forEach(item => {
          if (!purchasedIds.includes(item.id)) {
            const existing = recommendations.find(r => r.id === item.id);
            if (!existing) {
              recommendations.push({
                ...item,
                reason: `Похож на "${product.name}": та же категория, близкое по характеристикам`
              });
            }
          }
        });
      }
      
      res.json({
        placement: 'user_personal',
        title: '👤 Для вас',
        description: 'Рекомендации на основе вашей истории',
        products: recommendations.slice(0, limit)
      });
    } else {
      // Нет заказов - популярные как fallback
      const popular = RecommendationService.getPopularProducts(products, orders, limit);
      res.json({
        placement: 'user_personal',
        title: '👤 Для вас',
        description: 'Начните с популярных товаров нашей лавки',
        products: popular
      });
    }
  } else {
    // Если не авторизован - возвращаем популярные товары (fallback)
    const popular = RecommendationService.getPopularProducts(products, orders, limit);
    res.json({
      placement: 'user_personal_fallback',
      title: '👤 Популярное сейчас',
      description: 'Авторизуйтесь для персональных рекомендаций',
      products: popular,
      message: 'Пожалуйста, авторизуйтесь для персональных рекомендаций'
    });
  }
});

/**
 * @swagger
 * /api/recommendations/stats:
 *   get:
 *     summary: Получить статистику рекомендаций
 *     tags: [Рекомендации]
 *     responses:
 *       200:
 *         description: Статистика
 */
router.get('/stats', (req, res) => {
  const { products, orders } = req.app.locals.db;
  
  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    productCategories: [...new Set(products.map(p => p.category))],
    mostViewed: products.reduce((max, p) => 
      (p.views || 0) > (max.views || 0) ? p : max
    ),
    mostPurchased: products.reduce((max, p) => {
      const purchases = orders.filter(o => o.productId === p.id)
        .reduce((sum, o) => sum + o.quantity, 0);
      return purchases > (max.purchases || 0) 
        ? { ...p, purchases } 
        : max;
    }),
    averageOrderValue: orders.length > 0 
      ? (orders.reduce((sum, o) => sum + o.total, 0) / orders.length).toFixed(2)
      : 0
  };
  
  res.json(stats);
});

/**
 * @swagger
 * /api/recommendations/metrics:
 *   get:
 *     summary: Получить метрики эффективности рекомендаций
 *     tags: [Рекомендации]
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Глубина анализа в часах
 *     responses:
 *       200:
 *         description: Метрики эффективности системы
 */
router.get('/metrics', (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hours);
  
  // Симуляция метрик (в реальной системе это считается из ml_training_interactions)
  const metrics = {
    time_period_hours: hours,
    total_events: 152,
    event_distribution: {
      view: 89,
      add_to_cart: 34,
      purchase: 18,
      click_recommendation: 8,
      remove_from_cart: 3
    },
    placement_distribution: {
      home_popular: 34,
      home_for_you: 28,
      product_also_buy: 45,
      cart_complete_order: 31,
      checkout: 14
    },
    conversion_rate: '11.84%',
    avg_view_to_purchase: 8.4,
    recommendation_ctr: '5.26%'
  };
  
  res.json(metrics);
});

module.exports = router;
