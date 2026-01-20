/**
 * API Client Configuration
 *
 * This file contains shared utilities for API operations.
 * Will eventually contain Supabase client for production.
 */

/**
 * Simulates async API call
 * Replace with actual fetch/Supabase calls later
 */
export const simulateApiCall = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 100);
  });
};

/**
 * Simulates API error
 */
export const simulateApiError = (message: string): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), 100);
  });
};

/**
 * Future Supabase client setup:
 *
 * import { createClient } from '@supabase/supabase-js'
 *
 * export const supabase = createClient(
 *   process.env.VITE_SUPABASE_URL!,
 *   process.env.VITE_SUPABASE_ANON_KEY!
 * )
 */
