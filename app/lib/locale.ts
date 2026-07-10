export type Locale = "uz" | "ru" | "en";

export const LOCALE_STORAGE_KEY = "savdomarket_locale";
export const LOCALES: Locale[] = ["uz", "ru", "en"];

export const LOCALE_META: Record<
  Locale,
  { label: string; native: string; flag: string; htmlLang: string; numberLocale: string }
> = {
  uz: { label: "O'zbek", native: "O'zbekcha", flag: "🇺🇿", htmlLang: "uz", numberLocale: "uz-UZ" },
  ru: { label: "Русский", native: "Русский", flag: "🇷🇺", htmlLang: "ru", numberLocale: "ru-RU" },
  en: { label: "English", native: "English", flag: "🇬🇧", htmlLang: "en", numberLocale: "en-US" },
};

type Dict = {
  nav: Record<string, string>;
  settings: Record<string, string>;
  pages: Record<string, string>;
  catalog: Record<string, string>;
  cart: Record<string, string>;
  orders: Record<string, string>;
  favorites: Record<string, string>;
  chat: Record<string, string>;
  auth: Record<string, string>;
  common: Record<string, string>;
  languagePicker: Record<string, string>;
  theme: Record<string, string>;
  map: Record<string, string>;
  firma: Record<string, string>;
};

const uz: Dict = {
  nav: { home: "Asosiy", favorites: "Sevimli", add: "Qo'shish", order: "Buyurtma", cart: "Savat", chat: "Chat", map: "Xarita", settings: "Sozlamalar" },
  settings: {
    title: "Sozlamalar", account: "Hisob", app: "Ilova", security: "Xavfsizlik", email: "Email", phone: "Telefon",
    role: "Rol", copy: "Nusxa", call: "Qo'ng'iroq", manufacturer: "Ishlab chiqaruvchi", seller: "Sotuvchi",
    panelMaker: "Ishlab chiqaruvchi paneli", panelSeller: "Mahsulot katalogi", panelSub: "Asosiy ish joyingiz",
    orders: "Buyurtmalarim", ordersSub: "{n} ta buyurtma", chats: "Suhbatlar", chatsSub: "Xabarlar va bildirishnomalar",
    favorites: "Sevimlilar", favoritesSub: "{n} ta mahsulot", mapSettings: "Xarita sozlamalari",
    mapSub: "Yaqin atrofdagi ishlab chiqaruvchilar", language: "Til", languageSub: "Interfeys tilini tanlang", appearance: "Ko'rinish",
    theme: "Mavzu", themeSub: "Yorug' yoki qorong'i rejim",
    logout: "Chiqish", logoutSub: "Hisobdan chiqish", logoutConfirm: "Chiqasizmi?", logoutDesc: "Hisobingizdan chiqiladi",
    cancel: "Bekor", emailCopied: "Email nusxalandi", version: "SavdoMarket · v1.0.0",
  },
  theme: { light: "Yorug'", dark: "Qorong'i", system: "Tizim", title: "Mavzuni tanlang", subtitle: "Interfeys ko'rinishini sozlang", saved: "Mavzu o'zgartirildi" },
  map: {
    title: "Xaritadan", subtitle: "Yaqin hududdagi ishlab chiqaruvchilar", locating: "Joylashuv aniqlanmoqda...",
    locationOff: "Joylashuv o'chirilgan", near: "Yaqin atrofda", radius: "Radius", allRadius: "Hammasi",
    found: "{n} ta topildi", none: "Bu hududda mahsulot yo'q", order: "Buyurtma", message: "Yozish", call: "Qo'ng'iroq",
    distance: "{km} km", you: "Siz", retryLocation: "Joylashuvni qayta aniqlash",
  },
  firma: {
    dashboard: "Boshqaruv paneli", catalog: "Mahsulotlar", addProduct: "Mahsulot qo'shish", editProduct: "Tahrirlash",
    newOrders: "Yangi", inProgress: "Jarayonda", completed: "Hafta", revenue: "Daromad", lowStock: "Kam qoldi",
    searchOrders: "Buyurtma yoki sotuvchini qidiring...", searchProducts: "Mahsulotni qidiring...",
    noOrders: "Hali buyurtma yo'q", noProducts: "Hali mahsulot yo'q", addFirst: "Birinchi mahsulotni qo'shing",
    accept: "Qabul qilish", reject: "Rad etish", ship: "Yuborish", active: "Faol", inactive: "Faol emas",
    stock: "Zaxira", price: "Narx", unit: "Birlik", save: "Saqlash", delete: "O'chirish", tabOrders: "Buyurtmalar", tabProducts: "Mahsulotlar",
  },
  pages: { favorites: "Sevimlilar", orders: "Buyurtmalarim", chat: "Suhbatlar", map: "Xaritadan", mapSub: "Yaqin hududdagi ishlab chiqaruvchilar" },
  catalog: {
    search: "Mahsulot yoki ishlab chiqaruvchini qidiring...", all: "Hammasi", noResults: "Hech narsa topilmadi",
    noProducts: "Ishlab chiqaruvchilar hali mahsulot qo'shmagan.", tryFilter: "Qidiruv yoki kategoriyani o'zgartirib ko'ring.",
    order: "Buyurtma", orderSent: "Buyurtma yuborildi", orderAndChat: "Buyurtma + yozish", outOfStock: "Zaxira tugagan",
    perUnit: "so'm", loadError: "Ma'lumotlarni yuklab bo'lmadi", total: "Jami", qty: "Miqdor",
    addToCart: "Savatga", added: "Savatga qo'shildi", inCart: "Savatda",
  },
  cart: {
    title: "Savat", empty: "Savat bo'sh", emptySub: "Katalogdan mahsulot qo'shing", toCatalog: "Katalogga o'tish",
    checkout: "Buyurtma berish", placing: "Yuborilmoqda...", placed: "Buyurtma berildi", clear: "Tozalash", remove: "O'chirish",
    note: "Izoh (ixtiyoriy)", notePlaceholder: "Yetkazib berish manzili, shoshilinch...", total: "Jami",
    supplier: "Ishlab chiqaruvchi", items: "{n} mahsulot", suppliers: "{n} firma", grandTotal: "Umumiy summa",
  },
  orders: {
    empty: "Hali buyurtma yo'q", emptySub: "Katalogdan mahsulot tanlab buyurtma bering", toCatalog: "Katalogga o'tish",
    filterAll: "Hammasi", filterPending: "Kutilmoqda", filterActive: "Jarayonda", filterDone: "Yakunlangan", filterRejected: "Rad etilgan",
    reason: "Sabab", note: "Izoh", reorder: "Boshqa ishlab chiqaruvchidan", message: "Yozish",
    received: "Qabul qildim", confirmReceived: "Buyurtmani qabul qildingizmi?", orderNo: "Buyurtma",
    status_yangi: "Kutilmoqda", status_qabul_qilindi: "Qabul qilindi", status_yuborildi: "Yuborildi",
    status_yetkazildi: "Yetkazildi", status_rad_etildi: "Rad etildi", status_jarayonda: "Jarayonda",
  },
  favorites: {
    empty: "Sevimlilar bo'sh", emptySub: "Katalogdagi yurakcha tugmasi bilan saqlang", toCatalog: "Katalogga o'tish", messageOwner: "Egasiga yozish",
  },
  chat: { empty: "Hali suhbat yo'q", emptySub: "Buyurtma yuborganingizdan keyin shu yerda ko'rinadi", noMessages: "Hali xabar yo'q. Birinchi bo'lib yozing." },
  auth: {
    welcome: "Xush kelibsiz!", welcomeSub: "Hisobingizga tez kiring yoki test rejimida kirish",
    email: "Email manzilingiz", phone: "Telefon raqamingiz", password: "Parol", login: "Kirish", loggingIn: "Kirilmoqda...",
    registerTitle: "Yangi hisob yaratish", registerSub: "Tez ro'yxatdan o'ting", name: "Ismingiz", role: "Rolingiz",
    noAccount: "Hali ro'yxatdan o'tmaganmisiz?", hasAccount: "Hisobingiz bormi?", registerLink: "Bu yerdan ro'yxatdan o'ting",
    loginLink: "Kirish", seller: "Sotuvchi", maker: "Ishlab chiqaruvchi",
    namePlaceholder: "Ism va familiya", emailPlaceholder: "ism@misol.com", phonePlaceholder: "+998901234567",
    passwordPlaceholder: "Kamida 8 ta belgi", passwordHint: "••••••••", selectRole: "Rolni tanlang", choose: "Tanlang...",
    register: "Ro'yxatdan o'tish", registering: "Yuborilmoqda...", testMode: "Tezkor test kirish", enterAs: "{role} sifatida kirish",
    registerError: "Ro'yxatdan o'tishda xatolik", loginError: "Kirishda xatolik", testError: "Test kirishda xatolik. Backend ishlayaptimi?",
  },
  common: { offline: "Internet aloqasi yo'q", loading: "Yuklanmoqda...", som: "so'm", retry: "Qayta urinish" },
  languagePicker: { title: "Tilni tanlang", subtitle: "Ilova interfeysi tanlangan tilga o'zgaradi", saved: "Til o'zgartirildi" },
};

const ru: Dict = {
  nav: { home: "Главная", favorites: "Избранное", add: "Добавить", order: "Заказ", cart: "Корзина", chat: "Чат", map: "Карта", settings: "Настройки" },
  settings: {
    title: "Настройки", account: "Аккаунт", app: "Приложение", security: "Безопасность", email: "Email", phone: "Телефон",
    role: "Роль", copy: "Копировать", call: "Позвонить", manufacturer: "Производитель", seller: "Продавец",
    panelMaker: "Панель производителя", panelSeller: "Каталог товаров", panelSub: "Ваше рабочее место",
    orders: "Мои заказы", ordersSub: "{n} заказов", chats: "Чаты", chatsSub: "Сообщения и уведомления",
    favorites: "Избранное", favoritesSub: "{n} товаров", mapSettings: "Настройки карты",
    mapSub: "Производители рядом", language: "Язык", languageSub: "Выберите язык интерфейса", appearance: "Внешний вид",
    theme: "Тема", themeSub: "Светлый или тёмный режим",
    logout: "Выйти", logoutSub: "Выход из аккаунта", logoutConfirm: "Выйти?", logoutDesc: "Вы выйдете из аккаунта",
    cancel: "Отмена", emailCopied: "Email скопирован", version: "SavdoMarket · v1.0.0",
  },
  theme: { light: "Светлая", dark: "Тёмная", system: "Система", title: "Выберите тему", subtitle: "Настройте внешний вид интерфейса", saved: "Тема изменена" },
  map: {
    title: "На карте", subtitle: "Производители рядом", locating: "Определяем местоположение...",
    locationOff: "Геолокация отключена", near: "Рядом", radius: "Радиус", allRadius: "Все",
    found: "Найдено: {n}", none: "В этой зоне нет товаров", order: "Заказ", message: "Написать", call: "Позвонить",
    distance: "{km} км", you: "Вы", retryLocation: "Определить заново",
  },
  firma: {
    dashboard: "Панель управления", catalog: "Товары", addProduct: "Добавить товар", editProduct: "Редактировать",
    newOrders: "Новые", inProgress: "В процессе", completed: "Неделя", revenue: "Доход", lowStock: "Мало",
    searchOrders: "Поиск заказа или продавца...", searchProducts: "Поиск товара...",
    noOrders: "Заказов пока нет", noProducts: "Товаров пока нет", addFirst: "Добавьте первый товар",
    accept: "Принять", reject: "Отклонить", ship: "Отправить", active: "Активен", inactive: "Неактивен",
    stock: "Остаток", price: "Цена", unit: "Ед.", save: "Сохранить", delete: "Удалить", tabOrders: "Заказы", tabProducts: "Товары",
  },
  pages: { favorites: "Избранное", orders: "Мои заказы", chat: "Чаты", map: "На карте", mapSub: "Производители рядом" },
  catalog: {
    search: "Поиск товара или производителя...", all: "Все", noResults: "Ничего не найдено",
    noProducts: "Производители ещё не добавили товары.", tryFilter: "Измените поиск или категорию.",
    order: "Заказ", orderSent: "Заказ отправлен", orderAndChat: "Заказ + чат", outOfStock: "Нет в наличии",
    perUnit: "сум", loadError: "Не удалось загрузить данные", total: "Итого", qty: "Количество",
    addToCart: "В корзину", added: "Добавлено в корзину", inCart: "В корзине",
  },
  cart: {
    title: "Корзина", empty: "Корзина пуста", emptySub: "Добавьте товары из каталога", toCatalog: "В каталог",
    checkout: "Оформить заказ", placing: "Отправка...", placed: "Заказ оформлен", clear: "Очистить", remove: "Удалить",
    note: "Примечание (необязательно)", notePlaceholder: "Адрес доставки, срочность...", total: "Итого",
    supplier: "Производитель", items: "{n} товаров", suppliers: "{n} производителей", grandTotal: "Общая сумма",
  },
  orders: {
    empty: "Заказов пока нет", emptySub: "Выберите товар в каталоге", toCatalog: "В каталог",
    filterAll: "Все", filterPending: "Ожидание", filterActive: "В процессе", filterDone: "Завершённые", filterRejected: "Отклонённые",
    reason: "Причина", note: "Примечание", reorder: "У другого производителя", message: "Написать",
    received: "Получено", confirmReceived: "Вы получили заказ?", orderNo: "Заказ",
    status_yangi: "Ожидание", status_qabul_qilindi: "Принят", status_yuborildi: "Отправлен",
    status_yetkazildi: "Доставлен", status_rad_etildi: "Отклонён", status_jarayonda: "В процессе",
  },
  favorites: {
    empty: "Избранное пусто", emptySub: "Сохраняйте товары через сердечко в каталоге", toCatalog: "В каталог", messageOwner: "Написать продавцу",
  },
  chat: { empty: "Чатов пока нет", emptySub: "Появятся после отправки заказа", noMessages: "Сообщений пока нет. Напишите первым." },
  auth: {
    welcome: "Добро пожаловать!", welcomeSub: "Быстрый вход или тестовый режим",
    email: "Email", phone: "Телефон", password: "Пароль", login: "Войти", loggingIn: "Вход...",
    registerTitle: "Создать аккаунт", registerSub: "Быстрая регистрация", name: "Имя", role: "Роль",
    noAccount: "Нет аккаунта?", hasAccount: "Уже есть аккаунт?", registerLink: "Зарегистрироваться", loginLink: "Войти",
    seller: "Продавец", maker: "Производитель",
    namePlaceholder: "Имя и фамилия", emailPlaceholder: "imya@primer.com", phonePlaceholder: "+998901234567",
    passwordPlaceholder: "Минимум 8 символов", passwordHint: "••••••••", selectRole: "Выберите роль", choose: "Выберите...",
    register: "Зарегистрироваться", registering: "Отправка...", testMode: "Быстрый тестовый вход", enterAs: "Войти как {role}",
    registerError: "Ошибка регистрации", loginError: "Ошибка входа", testError: "Ошибка тестового входа. Бэкенд работает?",
  },
  common: { offline: "Нет подключения к интернету", loading: "Загрузка...", som: "сум", retry: "Повторить" },
  languagePicker: { title: "Выберите язык", subtitle: "Интерфейс переключится на выбранный язык", saved: "Язык изменён" },
};

const en: Dict = {
  nav: { home: "Home", favorites: "Favorites", add: "Add", order: "Order", cart: "Cart", chat: "Chat", map: "Map", settings: "Settings" },
  settings: {
    title: "Settings", account: "Account", app: "App", security: "Security", email: "Email", phone: "Phone",
    role: "Role", copy: "Copy", call: "Call", manufacturer: "Manufacturer", seller: "Seller",
    panelMaker: "Manufacturer panel", panelSeller: "Product catalog", panelSub: "Your main workspace",
    orders: "My orders", ordersSub: "{n} orders", chats: "Chats", chatsSub: "Messages and notifications",
    favorites: "Favorites", favoritesSub: "{n} products", mapSettings: "Map settings",
    mapSub: "Manufacturers near you", language: "Language", languageSub: "Choose interface language", appearance: "Appearance",
    theme: "Theme", themeSub: "Light or dark mode",
    logout: "Log out", logoutSub: "Sign out of your account", logoutConfirm: "Log out?", logoutDesc: "You will be signed out",
    cancel: "Cancel", emailCopied: "Email copied", version: "SavdoMarket · v1.0.0",
  },
  theme: { light: "Light", dark: "Dark", system: "System", title: "Choose theme", subtitle: "Customize the interface appearance", saved: "Theme updated" },
  map: {
    title: "Map view", subtitle: "Manufacturers in your area", locating: "Detecting location...",
    locationOff: "Location is off", near: "Nearby", radius: "Radius", allRadius: "All",
    found: "{n} found", none: "No products in this area", order: "Order", message: "Message", call: "Call",
    distance: "{km} km", you: "You", retryLocation: "Detect location again",
  },
  firma: {
    dashboard: "Dashboard", catalog: "Products", addProduct: "Add product", editProduct: "Edit",
    newOrders: "New", inProgress: "In progress", completed: "Week", revenue: "Revenue", lowStock: "Low",
    searchOrders: "Search order or seller...", searchProducts: "Search product...",
    noOrders: "No orders yet", noProducts: "No products yet", addFirst: "Add your first product",
    accept: "Accept", reject: "Reject", ship: "Ship", active: "Active", inactive: "Inactive",
    stock: "Stock", price: "Price", unit: "Unit", save: "Save", delete: "Delete", tabOrders: "Orders", tabProducts: "Products",
  },
  pages: { favorites: "Favorites", orders: "My orders", chat: "Chats", map: "Map view", mapSub: "Manufacturers in your area" },
  catalog: {
    search: "Search products or manufacturers...", all: "All", noResults: "Nothing found",
    noProducts: "No products added yet.", tryFilter: "Try a different search or category.",
    order: "Order", orderSent: "Order sent", orderAndChat: "Order + chat", outOfStock: "Out of stock",
    perUnit: "UZS", loadError: "Failed to load data", total: "Total", qty: "Quantity",
    addToCart: "Add to cart", added: "Added to cart", inCart: "In cart",
  },
  cart: {
    title: "Cart", empty: "Your cart is empty", emptySub: "Add products from the catalog", toCatalog: "Go to catalog",
    checkout: "Place order", placing: "Placing...", placed: "Order placed", clear: "Clear", remove: "Remove",
    note: "Note (optional)", notePlaceholder: "Delivery address, urgency...", total: "Total",
    supplier: "Supplier", items: "{n} items", suppliers: "{n} suppliers", grandTotal: "Grand total",
  },
  orders: {
    empty: "No orders yet", emptySub: "Pick a product from the catalog", toCatalog: "Go to catalog",
    filterAll: "All", filterPending: "Pending", filterActive: "In progress", filterDone: "Completed", filterRejected: "Rejected",
    reason: "Reason", note: "Note", reorder: "Try another supplier", message: "Message",
    received: "Received", confirmReceived: "Did you receive the order?", orderNo: "Order",
    status_yangi: "Pending", status_qabul_qilindi: "Accepted", status_yuborildi: "Shipped",
    status_yetkazildi: "Delivered", status_rad_etildi: "Rejected", status_jarayonda: "In progress",
  },
  favorites: {
    empty: "No favorites", emptySub: "Save products with the heart icon in the catalog", toCatalog: "Go to catalog", messageOwner: "Message seller",
  },
  chat: { empty: "No chats yet", emptySub: "They appear after you place an order", noMessages: "No messages yet. Say hello!" },
  auth: {
    welcome: "Welcome!", welcomeSub: "Sign in quickly or use test mode",
    email: "Email address", phone: "Phone number", password: "Password", login: "Sign in", loggingIn: "Signing in...",
    registerTitle: "Create account", registerSub: "Quick registration", name: "Full name", role: "Role",
    noAccount: "Don't have an account?", hasAccount: "Already have an account?", registerLink: "Register here", loginLink: "Sign in",
    seller: "Seller", maker: "Manufacturer",
    namePlaceholder: "Full name", emailPlaceholder: "name@example.com", phonePlaceholder: "+998901234567",
    passwordPlaceholder: "At least 8 characters", passwordHint: "••••••••", selectRole: "Select role", choose: "Choose...",
    register: "Register", registering: "Submitting...", testMode: "Quick test access", enterAs: "Enter as {role}",
    registerError: "Registration failed", loginError: "Sign-in failed", testError: "Test login failed. Is the backend running?",
  },
  common: { offline: "No internet connection", loading: "Loading...", som: "UZS", retry: "Retry" },
  languagePicker: { title: "Choose language", subtitle: "The app interface will switch to the selected language", saved: "Language updated" },
};

export const MESSAGES: Record<Locale, Dict> = { uz, ru, en };

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "uz";
  const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
  return raw === "ru" || raw === "en" || raw === "uz" ? raw : "uz";
}

export function storeLocale(locale: Locale) {
  if (typeof window !== "undefined") localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function translate(locale: Locale, path: string, vars?: Record<string, string | number>): string {
  const parts = path.split(".");
  let node: unknown = MESSAGES[locale];
  for (const p of parts) {
    if (node && typeof node === "object" && p in node) node = (node as Record<string, unknown>)[p];
    else return path;
  }
  if (typeof node !== "string") return path;
  if (!vars) return node;
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), node);
}
