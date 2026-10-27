import { imageUrl } from './supabase.js';

export function productImage(product) {
  return product.image_path ? imageUrl(product.image_path) : '';
}
