import {
  AirVent,
  Bath,
  Bed,
  ChefHat,
  Coffee,
  Container,
  CookingPot,
  Droplets,
  Fan,
  Flame,
  IceCreamCone,
  Microwave,
  Package,
  Refrigerator,
  Snowflake,
  Trash2,
  Utensils,
  WashingMachine,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// 카테고리 아이콘은 슬러그로 고정 매핑한다. 아이콘 이미지를 따로 올리기 전까지
// lucide 로 대체하되, electronics_categories.icon_url 이 있으면 그쪽이 우선한다.
const ICONS: Record<string, LucideIcon> = {
  'water-purifier': Droplets,
  refrigerator: Refrigerator,
  'kimchi-refrigerator': Container,
  freezer: Snowflake,
  dishwasher: Utensils,
  'electric-range': Flame,
  microwave: Microwave,
  'food-waste-disposer': Trash2,
  'coffee-machine': Coffee,
  'ice-maker': IceCreamCone,
  'air-fryer': ChefHat,
  bidet: Bath,
  'washing-machine': WashingMachine,
  mattress: Bed,
  'air-conditioner': AirVent,
  'air-purifier': Wind,
  dehumidifier: Fan,
  kitchen: CookingPot,
  living: Bath,
  air: Wind,
};

export function categoryIcon(slug: string): LucideIcon {
  return ICONS[slug] ?? Package;
}
