import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";

// 1. Define the base URL (Best practice: move this to process.env later)
const ProductServiceURL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3001";
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://localhost:3002";

// --- Tool 1: Search Product ---

// Define the Interface for the function input
interface SearchProductInput {
  query: string;
  token: string; // This is injected by your agent, not the LLM
}

export const searchProduct = tool(
  async ({ query, token }: SearchProductInput) => {
    console.log("searchProduct called with:", { query });

    try {
      const response = await axios.get(`${ProductServiceURL}/products?q=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return JSON.stringify(response.data);
    } catch (error: any) {
      return `Error searching for products: ${error.message}`;
    }
  },
  {
    name: "searchProduct",
    description: "Search for products based on a query (e.g., 'laptop', 'shoes').",
    schema: z.object({
      query: z.string().describe("The search query for products"),
      // Notice: We do NOT put 'token' here because the AI doesn't generate it.
    }),
  }
);

// --- Tool 2: Add Product to Cart ---

// Define the Interface for the function input
interface AddToCartInput {
  productId: string;
  qty?: number;
  token: string;
}

export const addProductToCart = tool(
  async ({ productId, qty = 1, token }: AddToCartInput) => {
    console.log("addProductToCart called with:", { productId, qty });

    try {
      const response = await axios.post(
        `${CART_SERVICE_URL}/cart/items`,
        {
          productId,
          qty,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return `Successfully added product ${productId} (Qty: ${qty}) to cart.`;
    } catch (error: any) {
      return `Error adding to cart: ${error.message}`;
    }
  },
  {
    name: "addProductToCart",
    description: "Add a specific product to the shopping cart.",
    schema: z.object({
      productId: z.string().describe("The ID of the product to add"),
      qty: z
        .number()
        .describe("The quantity of the product to add (default is 1)")
        .default(1),
    }),
  }
);