/**
 * Sanity Studio Configuration
 *
 * This configures the Sanity Studio for the MoreStars blog.
 * The studio will be hosted at: https://morestars.sanity.studio
 *
 * To deploy the studio:
 * 1. cd sanity
 * 2. npx sanity deploy
 */

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

export default defineConfig({
  name: 'morestars-blog',
  title: 'MoreStars Blog',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'cnoshn9v',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // Blog Posts
            S.listItem()
              .title('Blog Posts')
              .schemaType('post')
              .child(
                S.documentTypeList('post')
                  .title('Blog Posts')
                  .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
              ),
            S.divider(),
            // Categories
            S.listItem()
              .title('Categories')
              .schemaType('category')
              .child(S.documentTypeList('category').title('Categories')),
            // Authors
            S.listItem()
              .title('Authors')
              .schemaType('author')
              .child(S.documentTypeList('author').title('Authors')),
          ])
    }),
    // Vision tool for testing GROQ queries
    visionTool()
  ],

  schema: {
    types: schemaTypes
  },

  // Document actions customization (optional)
  document: {
    // Only show publish action for these types
    actions: (prev, { schemaType }) => {
      // Remove delete action for posts in production (optional safety measure)
      // return prev.filter(action => action.name !== 'delete');
      return prev;
    }
  }
});
