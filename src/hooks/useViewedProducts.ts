import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as viewedProductsApi from "@/api/viewedProducts.api";

export const viewedProductKeys = {
  all: ["viewed-products"] as const,
};

/**
 * Fetch the set of viewed product IDs
 */
export const useViewedProducts = () => {
  return useQuery({
    queryKey: viewedProductKeys.all,
    queryFn: viewedProductsApi.fetchViewedProductIds,
    staleTime: 1000 * 60 * 5,
    select: (ids) => new Set(ids),
  });
};

/**
 * Mark a product as viewed
 */
export const useMarkProductViewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: viewedProductsApi.markProductViewed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: viewedProductKeys.all });
    },
  });
};
