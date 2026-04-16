const fs = require('fs');
const path = require('path');

// Локальная версия скрипта в каталоге проекта — работает с database.json рядом с файлом
const projectDbPath = path.resolve(__dirname, 'database.json');
const localCopyPath = path.join(__dirname, 'database_copy.json');

function copyDb() {
  if (!fs.existsSync(projectDbPath)) {
    console.error('Оригинальный файл database.json не найден по пути:', projectDbPath);
    process.exit(1);
  }
  fs.copyFileSync(projectDbPath, localCopyPath);
  console.log('Скопирован файл базы в', localCopyPath);
}

function readDb() {
  const raw = fs.readFileSync(localCopyPath, 'utf8');
  return JSON.parse(raw || '{}');
}

function writeDb(db) {
  fs.writeFileSync(localCopyPath, JSON.stringify(db, null, 2), 'utf8');
}

function demoCrud() {
  copyDb();
  const db = readDb();

  db.products = db.products || [];
  db.orders = db.orders || [];
  db.bookings = db.bookings || [];

  console.log('Текущие количества: products=', db.products.length, 'orders=', db.orders.length, 'bookings=', db.bookings.length);

  const demoOrder = {
    id: (db.orders.length ? db.orders[db.orders.length - 1].id + 1 : 1),
    items: [ { productId: db.products[0] ? db.products[0].id : 1, quantity: 1 } ],
    total: db.products[0] ? db.products[0].price || 0 : 0,
    status: 'processing',
    createdAt: new Date().toISOString()
  };

  db.orders.push(demoOrder);
  writeDb(db);

  console.log('Добавлен демонстрационный заказ с id=', demoOrder.id);
  console.log('Новые количества: orders=', db.orders.length);
}

if (require.main === module) {
  try {
    demoCrud();
  } catch (err) {
    console.error('Ошибка при выполнении демо:', err.message);
  }
}
