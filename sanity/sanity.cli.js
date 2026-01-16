/**
 * Sanity CLI Configuration
 */

import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    // TODO: Replace with your actual project ID
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'your-project-id',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production'
  }
});
