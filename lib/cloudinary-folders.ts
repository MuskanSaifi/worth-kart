/** Cloudinary folder layout under `worthkart/` */
export const CLOUDINARY_FOLDERS = {
  products: "worthkart/products",
  sellers: "worthkart/sellers",
  banners: "worthkart/banners",
  blogs: "worthkart/blogs",
  categories: "worthkart/categories",
  users: "worthkart/users",
  website: "worthkart/website",
} as const;

export type CloudinaryFolderKey = keyof typeof CLOUDINARY_FOLDERS;
