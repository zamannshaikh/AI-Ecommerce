import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";


const ProductServiceURL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3001";
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://localhost:3002";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:3003";


interface SearchProductInput {
  query: string;
  token: string; 
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
     
    }),
  }
);

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



interface GetCartInput {
  token: string;
}

export const getCart = tool(
  async ({ token }: GetCartInput) => {
    console.log("getCart called");

    try {
      const response = await axios.get(`${CART_SERVICE_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Format the output to be AI-friendly
      const cart = response.data;
      if (!cart || !cart.items || cart.items.length === 0) {
        return "The cart is empty.";
      }

      // We return a simplified string so the AI doesn't get overwhelmed by raw JSON
      return JSON.stringify({
        items: cart.items,
        totalPrice: cart.totalPrice,
      });
    } catch (error: any) {
      return `Error retrieving cart: ${error.message}`;
    }
  },
  {
    name: "getCart",
    description: "Retrieve the current items in the user's shopping cart. Use this when the user asks 'what is in my cart' or 'show me my cart'.",
    schema: z.object({
      // No schema needed, as the AI doesn't provide arguments for this
    }),
  }
);


// --- Tool 4: Remove Item from Cart ---

interface RemoveFromCartInput {
  productId: string;
  token: string;
}

export const removeCartItem = tool(
  async ({ productId, token }: RemoveFromCartInput) => {
    console.log("removeCartItem called with:", { productId });

    try {
      // Assuming your API is DELETE /api/cart/items/:productId
      await axios.delete(`${CART_SERVICE_URL}/cart/items/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return `Successfully removed product ${productId} from the cart.`;
    } catch (error: any) {
      return `Error removing item from cart: ${error.message}`;
    }
  },
  {
    name: "removeCartItem",
    description: "Remove a specific product from the shopping cart by its Product ID.",
    schema: z.object({
      productId: z.string().describe("The ID of the product to remove"),
    }),
  }
);







export const tools = [
  searchProduct,
  addProductToCart,
  getCart,
  removeCartItem,
  
];