const express = require("express");
const multer = require("multer");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const {
  createProductValidators,
} = require("../middlewares/validator.middleware");
const ProductController = require("../controllers/product.controller");
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/",
  createAuthMiddleware(["seller", "admin"]),
  upload.array("images", 5),
  createProductValidators,
  ProductController.createProductController
);
router.get("/", ProductController.getProductsController);
router.get("/:id", ProductController.getProductByIdController);
router.patch(
  "/:id",
  createAuthMiddleware(["seller"]),
  ProductController.updateProductController
);
router.delete(
  "/:id",
  createAuthMiddleware(["seller", "admin"]),
  ProductController.deleteProductController
);
module.exports = router;
