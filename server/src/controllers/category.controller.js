import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import * as categoryService from "../services/category.service.js";

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await categoryService.getCategories();

  sendSuccess(res, {
    message: "Categories fetched successfully",
    data: { categories },
  });
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  sendSuccess(res, {
    message: "Category fetched successfully",
    data: { category },
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  sendSuccess(res, {
    statusCode: 201,
    message: "Category created successfully",
    data: { category },
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);

  sendSuccess(res, {
    message: "Category updated successfully",
    data: { category },
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.deleteCategory(req.params.id);

  sendSuccess(res, {
    message: "Category deleted successfully",
    data: { category },
  });
});
