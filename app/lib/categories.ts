/** Mahsulot kategoriyalari — backend/core/categories.py bilan mos */
export const PRODUCT_CATEGORIES = [
  "Ichimliklar",
  "Shirinliklar",
  "Shokolad",
  "Oziq-ovqat",
  "Maishiy",
  "Elektronika",
  "Kiyim",
  "Mevalar va sabzavotlar",
  "Go'sht va parranda",
  "Sut mahsulotlari",
  "Non va pishiriq",
  "Konserva va tayyor ovqat",
  "Ziravorlar va souslar",
  "Uy-ro'zg'or buyumlari",
  "Tozalash vositalari",
  "Mebel va dekor",
  "Oshxona jihozlari",
  "Go'zallik va parfyumeriya",
  "Gigiyena va tibbiyot",
  "Bolalar tovarlari",
  "Sport va dam olish",
  "Poyabzal",
  "Aksessuarlar",
  "Soat va zargarlik",
  "Ofis va maktab",
  "Qurilish va ta'mirlash",
  "Avtomobil tovarlari",
  "Hayvonlar uchun",
  "Bog' va o'rgimchilik",
  "Kitob va hujjatlar",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Eski ma'lumotlar uchun (masalan: shokolad → Shokolad) */
export function normalizeCategory(value: string): string {
  const aliases: Record<string, string> = {
    shokolad: "Shokolad",
    ichimliklar: "Ichimliklar",
  };
  return aliases[value.toLowerCase()] ?? value;
}

export function categoryOptionsFor(current?: string): string[] {
  const base = [...PRODUCT_CATEGORIES];
  if (current && !base.includes(current as ProductCategory)) {
    return [current, ...base];
  }
  return base;
}
