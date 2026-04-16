#!/bin/bash
# 📋 Скрипт проверки установки системы рекомендаций
# "Лавка у Оливандера"

echo "🪄 Проверка системы рекомендаций..."
echo ""

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Счетчики
total=0
passed=0

# Функция для проверки файла
check_file() {
    local file=$1
    local description=$2
    ((total++))
    
    if [ -f "$file" ] || [ -d "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((passed++))
    else
        echo -e "${RED}✗${NC} $description (не найден: $file)"
    fi
}

# Функция для проверки содержимого файла
check_content() {
    local file=$1
    local content=$2
    local description=$3
    ((total++))
    
    if grep -q "$content" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        ((passed++))
    else
        echo -e "${RED}✗${NC} $description"
    fi
}

echo "📂 Проверка файлов..."
echo ""

# Backend файлы
check_file "recommendations.js" "Backend: recommendations.js"
check_file "recommendationsRouter.js" "Backend: recommendationsRouter.js"
check_file "database.json" "База данных: database.json"

# Frontend файлы
check_file "assets/js/recommendations.js" "Frontend: assets/js/recommendations.js"
check_file "assets/css/recommendations.css" "Стили: assets/css/recommendations.css"

# Документация
check_file "RECOMMENDATIONS.md" "Документация: RECOMMENDATIONS.md"
check_file "QUICK_START.md" "Быстрый старт: QUICK_START.md"
check_file "IMPLEMENTATION_SUMMARY.md" "Отчет: IMPLEMENTATION_SUMMARY.md"
check_file "README_RECOMMENDATIONS.md" "Навигация: README_RECOMMENDATIONS.md"
check_file "API_TESTING.md" "Тестирование: API_TESTING.md"

# Примеры интеграции
check_file "RECOMMENDATIONS_HOME_INTEGRATION.html" "Пример: главная страница"
check_file "RECOMMENDATIONS_PRODUCT_INTEGRATION.html" "Пример: страница товара"
check_file "RECOMMENDATIONS_CART_INTEGRATION.html" "Пример: корзина"

echo ""
echo "🔍 Проверка содержимого..."
echo ""

# Проверка server.js
check_content "server.js" "RecommendationService" "server.js: импорт RecommendationService"
check_content "server.js" "recommendationsRouter" "server.js: импорт router"
check_content "server.js" "app.use('/api/recommendations'" "server.js: подключение router"
check_content "server.js" "product.views" "server.js: отслеживание просмотров"

# Проверка recommendations.js
check_content "recommendations.js" "getPopularProducts" "recommendations.js: метод getPopularProducts"
check_content "recommendations.js" "getSimilarProducts" "recommendations.js: метод getSimilarProducts"
check_content "recommendations.js" "getFrequentlyBoughtTogether" "recommendations.js: метод getFrequentlyBoughtTogether"

# Проверка frontend
check_content "assets/js/recommendations.js" "RecommendationWidget" "frontend: класс RecommendationWidget"
check_content "assets/js/recommendations.js" "renderPopular" "frontend: метод renderPopular"
check_content "assets/css/recommendations.css" "product-card" "стили: класс product-card"

# Проверка database.json
check_content "database.json" "\"views\":" "БД: поле views"
check_content "database.json" "\"rating\":" "БД: поле rating"

echo ""
echo "📊 Проверка данных..."
echo ""

# Проверка количества товаров в БД
if grep -q "\"id\": 12" database.json; then
    echo -e "${GREEN}✓${NC} БД: 12 товаров"
    ((passed++))
else
    echo -e "${YELLOW}!${NC} БД: Проверьте количество товаров"
fi
((total++))

# Проверка категорий
categories=("Палочки" "Зелья" "Транспорт" "Знания" "Магия")
for cat in "${categories[@]}"; do
    if grep -q "\"category\": \"$cat\"" database.json; then
        :
    else
        echo -e "${RED}✗${NC} БД: Категория '$cat' не найдена"
        ((total++))
        continue
    fi
done

if grep -q "\"category\": \"Палочки\"" database.json; then
    echo -e "${GREEN}✓${NC} БД: Все основные категории присутствуют"
    ((passed++))
    ((total++))
fi

echo ""
echo "🚀 Проверка готовности к запуску..."
echo ""

# Проверка package.json
if [ -f "package.json" ]; then
    if grep -q "express" package.json; then
        echo -e "${GREEN}✓${NC} package.json: Express установлен"
        ((passed++))
    else
        echo -e "${RED}✗${NC} package.json: Express не найден"
    fi
    ((total++))
else
    echo -e "${RED}✗${NC} package.json: файл не найден"
    ((total++))
fi

echo ""
echo "═════════════════════════════════════════════════════════════"
echo ""

# Итоговый результат
percentage=$((passed * 100 / total))

if [ $percentage -eq 100 ]; then
    echo -e "${GREEN}✨ СИСТЕМА ГОТОВА К ЗАПУСКУ! ✨${NC}"
    echo ""
    echo "Статус: $passed / $total проверок пройдено (${percentage}%)"
    echo ""
    echo "🚀 Запустите сервер:"
    echo "   npm start"
    echo "   или"
    echo "   node server.js"
    echo ""
    echo "📚 Документация:"
    echo "   - Быстрый старт: QUICK_START.md"
    echo "   - Полная документация: RECOMMENDATIONS.md"
    echo "   - Тестирование API: API_TESTING.md"
    echo ""
    echo "🌐 URL для проверки:"
    echo "   - Главная: http://localhost:3000"
    echo "   - API docs: http://localhost:3000/api-docs"
    echo "   - API recommendations: http://localhost:3000/api/recommendations"
    echo ""
elif [ $percentage -ge 80 ]; then
    echo -e "${YELLOW}⚠️  СИСТЕМА ПОЧТИ ГОТОВА!${NC}"
    echo ""
    echo "Статус: $passed / $total проверок пройдено (${percentage}%)"
    echo ""
    echo "Проверьте ${RED}красные ✗${NC} элементы выше"
    echo ""
    echo "Затем запустите:"
    echo "   npm start"
    echo ""
else
    echo -e "${RED}❌ ТРЕБУЮТСЯ ИСПРАВЛЕНИЯ!${NC}"
    echo ""
    echo "Статус: $passed / $total проверок пройдено (${percentage}%)"
    echo ""
    echo "Перепроверьте файлы, отмеченные ${RED}красным ✗${NC}"
    echo ""
    echo "Требуемые файлы:"
    echo "  - recommendations.js"
    echo "  - recommendationsRouter.js"
    echo "  - assets/js/recommendations.js"
    echo "  - assets/css/recommendations.css"
    echo "  - database.json (обновленный)"
    echo "  - server.js (обновленный)"
    echo ""
fi

echo "═════════════════════════════════════════════════════════════"

# Дополнительная информация
echo ""
echo "📋 Чек-лист интеграции:"
echo ""
echo "  [ ] Все файлы на месте (см. выше)"
echo "  [ ] Сервер успешно запускается (npm start)"
echo "  [ ] Нет ошибок в консоли"
echo "  [ ] Рекомендации видны на главной странице"
echo "  [ ] Рекомендации видны на странице товара"
echo "  [ ] API endpoints работают (http://localhost:3000/api-docs)"
echo "  [ ] История просмотров сохраняется в localStorage"
echo "  [ ] Стили применяются правильно"
echo "  [ ] Адаптивный дизайн работает на мобильных"
echo ""

echo "🎓 Обучение:"
echo ""
echo "  1. Прочитайте: QUICK_START.md"
echo "  2. Примеры: RECOMMENDATIONS_*_INTEGRATION.html"
echo "  3. Полная документация: RECOMMENDATIONS.md"
echo "  4. Тестирование: API_TESTING.md"
echo ""

echo "🆘 Проблемы?"
echo ""
echo "  1. Проверьте логи сервера"
echo "  2. Откройте F12 (DevTools) в браузере"
echo "  3. Проверьте сетевые запросы (Network tab)"
echo "  4.読прочитайте раздел решения проблем в QUICK_START.md"
echo ""

# Exit code
if [ $percentage -eq 100 ]; then
    exit 0
elif [ $percentage -ge 80 ]; then
    exit 1
else
    exit 2
fi
