const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const axios = require("axios");

// ---------------- SEARCH PRODUCT ----------------
const search_product = tool(
  async ({ query, token }) => {
    console.log("search_product called:", { query });

    const response = await axios.get(
      `http://localhost:3001/api/products?q=${query}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return JSON.stringify(response.data);
  },
  {
    name: "search_product",
    description: "Search for products by query",
    schema: z.object({
      query: z.string().describe("Search query"),
    }),
  }
);

// ---------------- ADD TO CART ----------------
const addProductToCart = tool(
  async ({ productId, qty = 1, token }) => {
    await axios.post(
      `http://localhost:3002/api/cart/items`,
      { productId, qty },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return `Added product ${productId} (qty: ${qty}) to cart`;
  },
  {
    name: "addProductToCart",
    description: "Add a product to the cart",
    schema: z.object({
      productId: z.string(),
      qty: z.number().optional().default(1),
    }),
  }
);

module.exports = {
  search_product,
  addProductToCart,
};
