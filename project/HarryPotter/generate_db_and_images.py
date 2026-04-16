import json
import os
import random

root = os.path.dirname(__file__)
img_dir = os.path.join(root, 'assets', 'img')
os.makedirs(img_dir, exist_ok=True)
svgs = {
    'wand2.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fbe8ff"/><stop offset="100%" stop-color="#d3d6ff"/></linearGradient></defs><rect width="200" height="200" rx="32" fill="url(#g1)"/><path d="M50 40c10 20 100 20 110 0" fill="none" stroke="#6e4ae5" stroke-width="10" stroke-linecap="round"/><path d="M60 45l-10 110" stroke="#5f3dc4" stroke-width="12" stroke-linecap="round"/><circle cx="140" cy="50" r="18" fill="#fff" opacity="0.9"/><circle cx="140" cy="50" r="10" fill="#7b5bff"/></svg>',
    'champion-broom.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffe9c8"/><stop offset="100%" stop-color="#ffd5a4"/></linearGradient></defs><rect width="200" height="200" rx="32" fill="url(#g2)"/><path d="M40 80c20-10 100-20 120 0" fill="none" stroke="#a65916" stroke-width="12" stroke-linecap="round"/><path d="M40 80l110 40" stroke="#d39b4a" stroke-width="18" stroke-linecap="round"/><path d="M40 120l110 40" stroke="#ffdd92" stroke-width="14" stroke-linecap="round"/></svg>',
    'ink.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><radialGradient id="g3" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#d3b4ff"/><stop offset="100%" stop-color="#7552e5"/></radialGradient></defs><rect width="200" height="200" rx="32" fill="#f5f3ff"/><rect x="60" y="50" width="80" height="100" rx="18" fill="url(#g3)" opacity="0.95"/><path d="M70 50c0-10 10-14 20-14h20c10 0 20 4 20 14" fill="#3b1d6c"/><path d="M85 45l30 0" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>',
    'orb.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><radialGradient id="g4" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#8f7bff"/></radialGradient></defs><rect width="200" height="200" rx="32" fill="#e9ebff"/><circle cx="100" cy="100" r="58" fill="url(#g4)"/><circle cx="108" cy="90" r="10" fill="#fff" opacity="0.9"/><ellipse cx="100" cy="100" rx="72" ry="20" fill="#6c54d5" opacity="0.15"/></svg>',
    'spellbook.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f3ddff"/><stop offset="100%" stop-color="#d5bef9"/></linearGradient></defs><rect width="200" height="200" rx="32" fill="#faf5ff"/><path d="M55 45h70v110h-70z" fill="url(#g5)" stroke="#8d69ff" stroke-width="6"/><path d="M70 70h50" stroke="#6b49c6" stroke-width="8" stroke-linecap="round"/><path d="M70 95h50" stroke="#7455d5" stroke-width="6" stroke-linecap="round"/><path d="M70 120h50" stroke="#5e3ec3" stroke-width="6" stroke-linecap="round"/></svg>',
    'pouch.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="32" fill="#fff7ec"/><path d="M60 70c15 30 60 30 90 0" stroke="#d17d3e" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M55 70l20 55c5 10 25 10 30 0l20-55" fill="#f7d6ab" stroke="#c26a33" stroke-width="8"/><circle cx="100" cy="113" r="8" fill="#6b40a7"/></svg>',
    'breakfast.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="32" fill="#fff5f0"/><ellipse cx="110" cy="120" rx="60" ry="32" fill="#fbcd8f"/><ellipse cx="110" cy="100" rx="42" ry="22" fill="#fffaee"/><circle cx="90" cy="90" r="8" fill="#ff9f4d"/><circle cx="118" cy="80" r="6" fill="#f76d6d"/><path d="M100 40c0 18-16 36-36 36h72c-20 0-36-18-36-36z" fill="#ffd985" stroke="#f1b24b" stroke-width="5"/></svg>',
    'cloak.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#d7f8ff"/><stop offset="100%" stop-color="#9ad6ff"/></linearGradient></defs><rect width="200" height="200" rx="32" fill="#f0fbff"/><path d="M60 40c20 40 80 40 100 0v120c-20 20-80 20-100 0z" fill="url(#g6)" stroke="#42a6ff" stroke-width="8"/><path d="M70 120c10 20 50 20 60 0" stroke="#3b8fd8" stroke-width="10" stroke-linecap="round"/></svg>',
    'amulet.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="32" fill="#faf0ff"/><circle cx="100" cy="95" r="40" fill="#f8c7ff" stroke="#b15acf" stroke-width="8"/><circle cx="100" cy="95" r="18" fill="#ffffff"/><path d="M100 25v30" stroke="#a236c6" stroke-width="10" stroke-linecap="round"/><path d="M100 135v30" stroke="#a236c6" stroke-width="10" stroke-linecap="round"/></svg>',
    'crystal.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="32" fill="#eef7ff"/><path d="M100 36l32 64-32 64-32-64z" fill="#87d9ff" stroke="#4a99d1" stroke-width="6"/><path d="M100 36l-18 38 18 20 18-20z" fill="#c4eeff" opacity="0.9"/><path d="M100 164l28-40-16-20-12 14z" fill="#a8d6ff"/></svg>',
    'charm.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="32" fill="#faf8ff"/><path d="M100 40c-30 10-48 48-36 88 10 32 38 52 56 72 18-20 46-40 56-72 12-40-6-78-36-88z" fill="#f0d4ff" stroke="#a976df" stroke-width="8"/><circle cx="100" cy="100" r="22" fill="#fff" opacity="0.9"/></svg>',
    'cauldron.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="32" fill="#f8f7ff"/><ellipse cx="100" cy="130" rx="70" ry="30" fill="#362b62"/><path d="M60 120c0 20 80 20 80 0v-40c0-20-80-20-80 0z" fill="#21164b"/><path d="M80 80c8-24 32-24 40 0" stroke="#f3eeff" stroke-width="8" stroke-linecap="round"/><circle cx="88" cy="60" r="8" fill="#f3e3ff"/><circle cx="114" cy="50" r="6" fill="#c0a0ff"/></svg>',
    'scroll.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="32" fill="#fffaf0"/><path d="M60 50h80v100h-80z" fill="#f6e9c9" stroke="#d5b573" stroke-width="8"/><path d="M60 60h80" stroke="#b28c40" stroke-width="4"/><path d="M60 80h80" stroke="#b28c40" stroke-width="4"/><path d="M60 100h80" stroke="#b28c40" stroke-width="4"/><path d="M60 120h80" stroke="#b28c40" stroke-width="4"/></svg>',
    'map.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="32" fill="#f0fff3"/><path d="M50 40l40 10 30-10 40 15v95l-40-10-30 10-40-15z" fill="#d8f5d9" stroke="#5ca96f" stroke-width="7"/><path d="M70 80c20-15 40-15 55 0" stroke="#3a7b46" stroke-width="6" fill="none"/><path d="M70 100c10 15 25 25 40 20" stroke="#3b7f50" stroke-width="6" fill="none"/></svg>',
    'ring.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="32" fill="#fff8ee"/><ellipse cx="100" cy="100" rx="42" ry="42" fill="#ffe6a5" stroke="#d89d4a" stroke-width="12"/><ellipse cx="102" cy="102" rx="22" ry="22" fill="#fff6df"/><path d="M72 72l20-10 24 12" stroke="#a77b3f" stroke-width="8" fill="none" stroke-linecap="round"/></svg>'
}
for name, content in svgs.items():
    with open(os.path.join(img_dir, name), 'w', encoding='utf-8') as f:
        f.write(content)

if not os.path.exists(os.path.join(img_dir, 'feather.svg')):
    with open(os.path.join(img_dir, 'feather.svg'), 'w', encoding='utf-8') as f:
        f.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="32" fill="#f7f4ff"/><path d="M60 55c25 18 45 100 10 120" stroke="#7d5de5" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M70 60c20 20 35 85 10 115" stroke="#b394ff" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M80 85l45-20" stroke="#fde9ff" stroke-width="6" stroke-linecap="round"/></svg>')

categories = {
    'Палочки': ['wand1.svg', 'wand2.svg', 'feather.svg'],
    'Транспорт': ['broom.svg', 'champion-broom.svg'],
    'Зелья': ['potions.svg', 'oil.svg', 'cauldron.svg'],
    'Аксессуары': ['hat.svg', 'pouch.svg', 'cloak.svg', 'amulet.svg'],
    'Знания': ['spellbook.svg', 'scroll.svg', 'map.svg'],
    'Магия': ['orb.svg', 'crystal.svg', 'charm.svg'],
    'Еда': ['breakfast.svg'],
    'Украшения': ['ring.svg']
}
adjectives = ['Лунная', 'Солнечная', 'Тёмная', 'Яркая', 'Старинная', 'Сверхъестественная', 'Искрящаяся', 'Вечная', 'Туманная', 'Жаркая', 'Хрустальная', 'Медовая', 'Ледяная', 'Звёздная', 'Таинственная']
types = {
    'Палочки': ['палочка', 'жезл', 'палочка'],
    'Транспорт': ['метла', 'самокат', 'скейтборд'],
    'Зелья': ['зелье', 'эликсир', 'микс'],
    'Аксессуары': ['сумка', 'шляпа', 'ремень', 'пояс'],
    'Знания': ['книга', 'свиток', 'карта'],
    'Магия': ['кристалл', 'сфера', 'чарм'],
    'Еда': ['набор', 'угощение'],
    'Украшения': ['амулет', 'кольцо']
}
desc = {
    'Палочки': 'Изготовлена вручную из лучших материалов для точных заклинаний.',
    'Транспорт': 'Надёжный магический транспорт для любых путешествий.',
    'Зелья': 'Высококлассный зельеваренный состав для нужд волшебника.',
    'Аксессуары': 'Стильный и практичный аксессуар для вашей волшебной экипировки.',
    'Знания': 'Надёжный источник знаний для начинающих и опытных магов.',
    'Магия': 'Могущественный артефакт для усиления магической энергии.',
    'Еда': 'Вкусные угощения для заряда сил перед приключением.',
    'Украшения': 'Элегантное украшение с магическим эффектом.'
}
price_ranges = {
    'Палочки': (950, 5200),
    'Транспорт': (3200, 13500),
    'Зелья': (220, 1100),
    'Аксессуары': (280, 2200),
    'Знания': (600, 1800),
    'Магия': (1200, 6200),
    'Еда': (180, 780),
    'Украшения': (450, 3800)
}
products = []
for i in range(1, 1001):
    category = random.choice(list(categories.keys()))
    adjective = random.choice(adjectives)
    item = random.choice(types[category])
    name = f"{adjective} {item} {i}"
    price_min, price_max = price_ranges[category]
    price = random.randrange(price_min, price_max + 1, 50)
    stock = random.randint(0, 42)
    image = random.choice(categories[category])
    product = {
        'id': i,
        'name': name,
        'category': category,
        'description': f"{desc[category]} Идеально подходит для тех, кто ценит качество и магию.",
        'price': price,
        'stock': stock,
        'image': f"/assets/img/{image}",
        'views': random.randint(0, 450),
        'cartAdds': random.randint(0, 60),
        'rating': round(random.uniform(3.8, 5.0), 1),
        'ratingCount': random.randint(1, 160)
    }
    products.append(product)

orders = [
    {'id': 1, 'name': 'Иван Петров', 'email': 'ivan@example.com', 'phone': '+7-900-123-45-67', 'address': 'ул. Волшебная, д. 5', 'productId': 1, 'productName': products[0]['name'], 'quantity': 1, 'total': products[0]['price'], 'status': 'processing', 'createdAt': '2025-12-20T10:30:00.000Z'},
    {'id': 2, 'name': 'Мария Сидорова', 'email': 'maria@example.com', 'phone': '+7-901-987-65-43', 'address': 'ул. Магическая, д. 12', 'productId': 3, 'productName': products[2]['name'], 'quantity': 1, 'total': products[2]['price'], 'status': 'completed', 'createdAt': '2025-12-15T14:45:00.000Z'}
]
bookings = [
    {'id': 1, 'name': 'Алексей Иванов', 'phone': '+7-902-111-22-33', 'email': 'alex@example.com', 'serviceType': 'Мастер-класс по палочкам', 'date': '2025-12-28', 'description': 'Хочу научиться выбирать правильную палочку', 'status': 'pending', 'createdAt': '2025-12-21T09:15:00.000Z'},
    {'id': 2, 'name': 'Елена Смирнова', 'phone': '+7-903-333-44-55', 'email': 'elena@example.com', 'serviceType': 'Консультация по зельям', 'date': '2025-12-30', 'description': '', 'status': 'confirmed', 'createdAt': '2025-12-22T11:20:00.000Z'}
]

db = {'products': products, 'orders': orders, 'bookings': bookings}
with open(os.path.join(root, 'database.json'), 'w', encoding='utf-8') as f:
    json.dump(db, f, ensure_ascii=False, indent=2)

print(f'Wrote {len(products)} products and {len(svgs)+1} images')
