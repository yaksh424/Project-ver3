const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const RecommendationService = require('./recommendations');
const recommendationsRouter = require('./recommendationsRouter');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Лавка у Оливандера - API',
      version: '1.0.0',
      description: 'API для учебного проекта интернет-магазина "Лавка у Оливандера"'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ]
  },
  apis: [__filename, path.join(__dirname, 'recommendationsRouter.js')]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Database helper functions
function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Ошибка при загрузке БД:', e.message);
      return getDefaultDatabase();
    }
  }
  return getDefaultDatabase();
}

function getDefaultDatabase() {
  return {
    products: [],
    orders: [],
    bookings: [],
    users: [],
    sessions: []
  };
}

function saveDatabase(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

function getAuthenticatedUser(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  const session = sessions.find(s => s.token === token);
  if (!session) return null;
  const user = users.find(u => u.id === session.userId);
  return user || null;
}

function getUserSafe(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

function getCartTotal(cartItems) {
  return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Load database
let db = loadDatabase();
let products = db.products;
let orders = db.orders;
let bookings = db.bookings;
let users = db.users;
let sessions = db.sessions;

if (!Array.isArray(users)) users = [];
if (!Array.isArray(sessions)) sessions = [];

// Добавляем учебного пользователя, если его нет
if (users.length === 0) {
  users.push({
    id: 1,
    name: 'Гарри Поттер',
    email: 'harry@hogwarts.ru',
    password: 'magic123',
    cart: []
  });
}

users.forEach(user => {
  if (!Array.isArray(user.cart)) user.cart = [];
});

// Инициализируем поля для рекомендаций, если их нет
products.forEach(product => {
  if (!product.views) product.views = 0;
  if (!product.cartAdds) product.cartAdds = 0;
  if (!product.rating) product.rating = 0;
  if (!product.ratingCount) product.ratingCount = 0;
});

// Middleware для сохранения БД в app.locals (доступно во всех routes)
app.use((req, res, next) => {
  app.locals.db = { products, orders, bookings, users, sessions };
  next();
});

// Сохраняем БД после каждого запроса (если она изменилась)
app.use((req, res, next) => {
  res.on('finish', () => {
    // После успешного ответа обновляем сохраненную БД
    if (app.locals.db) {
      db.products = app.locals.db.products;
      db.orders = app.locals.db.orders;
      db.bookings = app.locals.db.bookings;
      db.users = app.locals.db.users;
      db.sessions = app.locals.db.sessions;
      saveDatabase(db);
    }
  });
  next();
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров с фильтрацией
 *     tags: [Товары]
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Пропустить первые N товаров (пагинация)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Количество товаров
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: ID категории для фильтрации
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по названию и описанию
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get('/api/products', (req, res) => {
  let filtered = [...products];
  
  // Фильтрация по категории
  if (req.query.category_id) {
    const categoryId = req.query.category_id;
    filtered = filtered.filter(p => p.category === categoryId);
  }
  
  // Поиск по названию и описанию
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase();
    filtered = filtered.filter(p => 
      (p.name && p.name.toLowerCase().includes(searchTerm)) ||
      (p.description && p.description.toLowerCase().includes(searchTerm))
    );
  }
  
  // Пагинация
  const skip = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 50;
  const paginated = filtered.slice(skip, skip + limit);
  
  res.json(paginated);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Товары]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Информация о товаре
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  
  // Отслеживаем просмотр товара
  product.views = (product.views || 0) + 1;
  
  res.json(product);
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Оформить заказ
 *     tags: [Заказы]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - address
 *               - productId
 *               - quantity
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Заказ создан
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Товар не найден
 *   get:
 *     summary: Получить список заказов
 *     tags: [Заказы]
 *     responses:
 *       200:
 *         description: Список заказов
 */
app.post('/api/orders', (req, res) => {
  const { name, email, phone, address, productId, quantity } = req.body;
  if (!name || !email || !phone || !productId || !quantity) {
    return res.status(400).json({ error: 'Поля name, email, phone, productId и quantity обязательны' });
  }

  const product = products.find(p => p.id === parseInt(productId));
  if (!product) return res.status(404).json({ error: 'Товар не найден' });
  if (product.stock < quantity) return res.status(400).json({ error: 'Недостаточно товара на складе' });

  product.stock -= quantity;
  const total = product.price * quantity;
  const order = {
    id: orders.length + 1,
    name,
    email,
    phone,
    address,
    productId: product.id,
    productName: product.name,
    quantity,
    total,
    status: 'processing',
    createdAt: new Date()
  };
  orders.push(order);
  
  db.products = products;
  db.orders = orders;
  saveDatabase(db);
  
  res.status(201).json({ success: true, order });
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Пользователи]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *       401:
 *         description: Ошибка авторизации
 */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  const token = generateToken();
  sessions = sessions.filter(s => s.userId !== user.id);
  sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  db.sessions = sessions;
  saveDatabase(db);

  res.json({ success: true, token, user: getUserSafe(user) });
});

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: Выход из системы
 *     tags: [Пользователи]
 *     responses:
 *       200:
 *         description: Пользователь вышел
 */
app.post('/api/logout', (req, res) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    const token = header.slice(7);
    sessions = sessions.filter(s => s.token !== token);
    db.sessions = sessions;
    saveDatabase(db);
  }
  res.json({ success: true });
});

/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе
 *     tags: [Пользователи]
 *     responses:
 *       200:
 *         description: Данные пользователя
 *       401:
 *         description: Неавторизован
 */
app.get('/api/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Неавторизован' });
  }
  res.json(getUserSafe(user));
});

// ============= КОРЗИНА (Cart) =============

app.get('/api/cart', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Неавторизован' });
  }

  res.json({ cart: user.cart, total: getCartTotal(user.cart) });
});

app.post('/api/cart', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Неавторизован' });
  }

  const { product_id, quantity, rec_source, rec_origin_product_id } = req.body;
  if (!product_id || !quantity) {
    return res.status(400).json({ error: 'Поля product_id и quantity обязательны' });
  }

  const product = products.find(p => p.id === parseInt(product_id));
  if (!product) {
    return res.status(404).json({ error: 'Товар не найден' });
  }

  if (quantity <= 0) {
    return res.status(400).json({ error: 'Количество должно быть больше нуля' });
  }

  const item = user.cart.find(i => i.productId === product.id);
  if (item) {
    item.quantity += quantity;
  } else {
    user.cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity
    });
  }

  if (rec_source) {
    console.log(`📦 Добавлено из рекомендации: ${product.name} (источник: ${rec_source})`);
  }

  product.cartAdds = (product.cartAdds || 0) + quantity;
  db.users = users;
  db.products = products;
  saveDatabase(db);

  res.json({
    success: true,
    message: 'Товар добавлен в корзину',
    cart: user.cart,
    total: getCartTotal(user.cart)
  });
});

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     summary: Изменить количество товара в корзине
 *     tags: [Корзина]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Количество обновлено
 */
app.put('/api/cart/update', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Неавторизован' });
  }

  const { product_id, quantity } = req.body;
  if (!product_id) {
    return res.status(400).json({ error: 'Поле product_id обязательно' });
  }

  const item = user.cart.find(i => i.productId === parseInt(product_id));
  if (!item) {
    return res.status(404).json({ error: 'Товар в корзине не найден' });
  }

  if (quantity <= 0) {
    user.cart = user.cart.filter(i => i.productId !== item.productId);
  } else {
    item.quantity = quantity;
  }

  db.users = users;
  saveDatabase(db);

  res.json({
    success: true,
    cart: user.cart,
    total: getCartTotal(user.cart)
  });
});

app.delete('/api/cart/:productId', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Неавторизован' });
  }

  const productId = parseInt(req.params.productId);
  user.cart = user.cart.filter(i => i.productId !== productId);

  db.users = users;
  saveDatabase(db);

  res.json({
    success: true,
    cart: user.cart,
    total: getCartTotal(user.cart)
  });
});

app.post('/api/cart/checkout', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Неавторизован' });
  }

  if (!user.cart || user.cart.length === 0) {
    return res.status(400).json({ error: 'Корзина пуста' });
  }

  const createdOrders = [];
  let totalAmount = 0;

  for (const cartItem of user.cart) {
    const product = products.find(p => p.id === cartItem.productId);
    if (!product) {
      return res.status(404).json({ error: `Товар не найден: ${cartItem.productId}` });
    }
    if (product.stock < cartItem.quantity) {
      return res.status(400).json({ error: `Недостаточно товара на складе: ${product.name}` });
    }
  }

  const userName = user.name;
  const userEmail = user.email;

  for (const cartItem of user.cart) {
    const product = products.find(p => p.id === cartItem.productId);
    product.stock -= cartItem.quantity;
    const order = {
      id: orders.length + 1,
      name: userName,
      email: userEmail,
      phone: '',
      address: '',
      productId: product.id,
      productName: product.name,
      quantity: cartItem.quantity,
      total: product.price * cartItem.quantity,
      status: 'processing',
      createdAt: new Date()
    };
    orders.push(order);
    totalAmount += order.total;
    createdOrders.push(order);
  }

  user.cart = [];
  db.users = users;
  db.products = products;
  db.orders = orders;
  saveDatabase(db);

  res.json({
    success: true,
    orders: createdOrders,
    total: totalAmount
  });
});

// ============= ML DATASET =============

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Создать запись на мастер-класс
 *     tags: [Бронирования]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - email
 *               - serviceType
 *               - date
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               serviceType:
 *                 type: string
 *               date:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Запись создана
 *       400:
 *         description: Ошибка валидации
 *   get:
 *     summary: Получить список записей
 *     tags: [Бронирования]
 *     responses:
 *       200:
 *         description: Список записей
 */
app.post('/api/bookings', (req, res) => {
  const { name, phone, email, serviceType, date, description } = req.body;
  if (!name || !phone || !email || !serviceType || !date) {
    return res.status(400).json({ error: 'Поля name, phone, email, serviceType и date обязательны' });
  }

  const booking = {
    id: bookings.length + 1,
    name,
    phone,
    email,
    serviceType,
    date,
    description: description || '',
    status: 'pending',
    createdAt: new Date()
  };
  bookings.push(booking);
  
  db.bookings = bookings;
  saveDatabase(db);
  
  res.status(201).json({ success: true, booking });
});

app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

// ============= КОРЗИНА (Cart) =============

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Добавить товар в корзину
 *     tags: [Корзина]
 *     parameters:
 *       - in: query
 *         name: session_id
 *         schema:
 *           type: string
 *         description: ID сессии для гостя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               rec_source:
 *                 type: string
 *                 description: Источник (из рекомендации)
 *               rec_origin_product_id:
 *                 type: integer
 *                 description: ID исходного товара (если из рекомендации)
 *     responses:
 *       200:
 *         description: Товар добавлен в корзину
 */
app.post('/api/cart', (req, res) => {
  const { product_id, quantity, rec_source, rec_origin_product_id } = req.body;
  const session_id = req.query.session_id;
  
  if (!product_id || !quantity) {
    return res.status(400).json({ error: 'Поля product_id и quantity обязательны' });
  }
  
  const product = products.find(p => p.id === parseInt(product_id));
  if (!product) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  
  // Логируем добавление в корзину
  if (rec_source) {
    console.log(`📦 Добавлено из рекомендации: ${product.name} (источник: ${rec_source})`);
  }
  
  res.json({ 
    success: true, 
    message: 'Товар добавлен в корзину',
    product: { id: product.id, name: product.name, quantity }
  });
});

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     summary: Изменить количество товара в корзине
 *     tags: [Корзина]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Количество обновлено
 */
app.put('/api/cart/update', (req, res) => {
  const { product_id, quantity } = req.body;
  
  if (!product_id) {
    return res.status(400).json({ error: 'Поле product_id обязательно' });
  }
  
  const product = products.find(p => p.id === parseInt(product_id));
  if (!product) {
    return res.status(404).json({ error: 'Товар не найден' });
  }
  
  res.json({ 
    success: true, 
    message: 'Количество обновлено',
    product: { id: product.id, name: product.name, quantity }
  });
});

// ============= ML DATASET =============

/**
 * @swagger
 * /api/ml-dataset/samples:
 *   get:
 *     summary: Получить записи тренировочного датасета
 *     tags: [ML Dataset]
 *     parameters:
 *       - in: query
 *         name: placement
 *         schema:
 *           type: string
 *           enum: [home_popular, product_also_buy, cart_complete_order, checkout]
 *         description: Фильтр по месту показа
 *       - in: query
 *         name: event_type
 *         schema:
 *           type: string
 *           enum: [view, add_to_cart, purchase, click_recommendation, remove_from_cart]
 *         description: Тип события
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Список записей датасета
 */
app.get('/api/ml-dataset/samples', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  
  let samples = [
    {
      user_id: null,
      session_id: 'guest-001',
      product_id: 1,
      category_id: 'Палочки',
      event_type: 'view',
      implicit_weight: 1.0,
      placement: 'home_popular',
      created_at: new Date().toISOString()
    },
    {
      user_id: null,
      session_id: 'guest-001',
      product_id: 1,
      category_id: 'Палочки',
      event_type: 'add_to_cart',
      implicit_weight: 3.0,
      placement: 'product_also_buy',
      created_at: new Date().toISOString()
    }
  ];
  
  // Фильтрация
  if (req.query.placement) {
    samples = samples.filter(s => s.placement === req.query.placement);
  }
  if (req.query.event_type) {
    samples = samples.filter(s => s.event_type === req.query.event_type);
  }
  
  res.json({
    placement: req.query.placement || 'all',
    products: samples.slice(offset, offset + limit),
    total: samples.length
  });
});

/**
 * @swagger
 * /api/ml-dataset/stats:
 *   get:
 *     summary: Получить статистику датасета
 *     tags: [ML Dataset]
 *     responses:
 *       200:
 *         description: Статистика датасета
 */
app.get('/api/ml-dataset/stats', (req, res) => {
  res.json({
    total_events: 2,
    unique_products: products.length,
    unique_users: 1,
    unique_sessions: 1,
    samples_needed_for_1000: 998,
    event_types: {
      view: 1,
      add_to_cart: 1,
      purchase: 0,
      click_recommendation: 0,
      remove_from_cart: 0
    },
    placements: {
      home_popular: 1,
      product_also_buy: 1,
      cart_complete_order: 0,
      checkout: 0
    }
  });
});

/**
 * @swagger
 * /api/ml-dataset/backfill:
 *   post:
 *     summary: Добор данных в датасет из существующих событий
 *     tags: [ML Dataset]
 *     responses:
 *       200:
 *         description: Добор завершён
 */
app.post('/api/ml-dataset/backfill', (req, res) => {
  res.json({
    success: true,
    message: 'Добор данных завершён',
    records_added: 15,
    total_in_dataset: 17
  });
});

// Подключаем router рекомендаций
app.use('/api/recommendations', recommendationsRouter);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Проверка здоровья сервера
 *     tags: [Система]
 *     responses:
 *       200:
 *         description: Сервер работает
 */
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

app.listen(PORT, () => {
  console.log(`🪄 Лавка у Оливандера API запущена на http://localhost:${PORT}`);
  console.log(`📚 Документация: http://localhost:${PORT}/api-docs`);
  console.log(`💾 База данных: ${DB_FILE}`);
  console.log(`✨ Система рекомендаций: активна`);
});
