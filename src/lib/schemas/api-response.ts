import { z } from 'zod';

// ============================================================================
// Common API Response Patterns
// ============================================================================

/**
 * Base response metadata shared across all API responses
 */
export const ApiResponseMetadataSchema = z.object({
  fromCache: z.boolean(),
  processingTimeMs: z.number().int().nonnegative(),
});

/**
 * Generic paginated list response
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    count: z.number().int().nonnegative(),
    items: z.array(itemSchema),
  });

/**
 * Generic search response with query and metadata
 */
export const createSearchResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z
    .object({
      query: z.string(),
      count: z.number().int().nonnegative(),
      items: z.array(itemSchema),
    })
    .extend(ApiResponseMetadataSchema.shape);

/**
 * Generic variants response (for rhyme searches with inclusive/sequence modes)
 */
export const createVariantsResponseSchema = <T extends z.ZodTypeAny>(
  listSchema: T
) =>
  z
    .object({
      query: z.string(),
      inclusive: listSchema.optional(),
      sequence: listSchema.optional(),
    })
    .extend(ApiResponseMetadataSchema.shape);

// ============================================================================
// Error Response Schemas
// ============================================================================

/**
 * Individual error detail in the error message array
 */
export const ApiErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  path: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
});

/**
 * API error response structure (nested under error key)
 */
export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.array(ApiErrorDetailSchema).or(z.string()),
  }),
});

/**
 * API error response structure (direct at top level)
 */
export const ApiDirectErrorResponseSchema = z.object({
  code: z.string(),
  message: z.array(ApiErrorDetailSchema).or(z.string()),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ApiResponseMetadata = z.infer<typeof ApiResponseMetadataSchema>;
export type ApiErrorDetail = z.infer<typeof ApiErrorDetailSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type ApiDirectErrorResponse = z.infer<
  typeof ApiDirectErrorResponseSchema
>;
