import { Category } from "../models/Category.js";
import { DEFAULT_CATEGORIES } from "../constants/categories.constant.js";
import { AppError } from "../utils/AppError.js";
import { slugify } from "../utils/slugify.js";

function normalizePayload(payload) {
  const data = { ...payload };
  if (data.name && !data.slug) data.slug = slugify(data.name);
  if (data.slug) data.slug = slugify(data.slug);
  if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder);
  return data;
}

export async function seedDefaultCategories() {
  const operations = DEFAULT_CATEGORIES.map((category) => ({
    updateOne: {
      filter: { slug: category.slug },
      update: { $setOnInsert: { ...category, isActive: true } },
      upsert: true,
    },
  }));

  if (operations.length) {
    await Category.bulkWrite(operations, { ordered: false });
  }
}

export async function getCategories() {
  return Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
}

export async function getCategoryById(categoryId) {
  const category = await Category.findOne({ _id: categoryId, isActive: true });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
}

export async function createCategory(payload) {
  const data = normalizePayload(payload);
  const existing = await Category.findOne({
    $or: [{ name: data.name }, { slug: data.slug }],
  });

  if (existing) {
    throw new AppError("Category already exists", 409);
  }

  return Category.create(data);
}

export async function updateCategory(categoryId, payload) {
  const data = normalizePayload(payload);

  if (data.name || data.slug) {
    const duplicate = await Category.findOne({
      _id: { $ne: categoryId },
      $or: [
        ...(data.name ? [{ name: data.name }] : []),
        ...(data.slug ? [{ slug: data.slug }] : []),
      ],
    });

    if (duplicate) {
      throw new AppError("Category already exists", 409);
    }
  }

  const category = await Category.findByIdAndUpdate(categoryId, data, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
}

export async function deleteCategory(categoryId) {
  const category = await Category.findByIdAndUpdate(
    categoryId,
    { isActive: false },
    { new: true }
  );

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
}
