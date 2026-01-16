/**
 * Sanity Schema Index
 * Export all document and object types for the schema
 */

// Object types (reusable)
import seo from './objects/seo';
import faq from './objects/faq';

// Document types
import post from './documents/post';
import author from './documents/author';
import category from './documents/category';

export const schemaTypes = [
  // Objects
  seo,
  faq,
  // Documents
  post,
  author,
  category
];
