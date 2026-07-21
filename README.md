# Sistema — preview (два продукта)

Отдельный репозиторий для проверки **без автодеплоя** на production.

## Страницы

| Файл | Описание |
|------|----------|
| `index.html` | Hub — выбор продукта |
| `game.html` | Игра «Система» |
| `kod-sistem.html` | Курс «Код систем» |

## Локальный просмотр

```bash
npx serve -l 3456 .
```

Открыть: http://localhost:3456/

## Как залить на GitHub (новый репозиторий)

1. На GitHub создайте **новый пустой** репозиторий, например `sistema-dual-product-preview`
2. **Не** подключайте его к Timeweb — только для review
3. В этой папке выполните:

```bash
git remote add origin https://github.com/ВАШ_ЛОГИН/sistema-dual-product-preview.git
git push -u origin main
```

## Production (не трогать при review)

- Тёмный сайт: `tunngle1/sistema-game` → Timeweb
- Светлый сайт: `tunngle1/sistema-game-light` → Timeweb

Этот preview-репозиторий **не связан** с ними.

## TODO перед продакшеном

- [ ] Вставить `paymentUrl` для курса в `config-course.js`
- [ ] Проверить endpoint бота для заявок «Код систем»
