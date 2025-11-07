/**
 * Custom ESLint rules for the Refashion AI project
 * 
 * This file defines local ESLint rules that enforce project-specific coding standards.
 * Used by eslint-plugin-local-rules package.
 */

module.exports = {
  'enforce-fetch-caching': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce explicit cache option on all fetch() calls for Next.js 15',
        category: 'Best Practices',
        recommended: true,
      },
      messages: {
        missingCacheOption: 'fetch() call must have explicit cache option: { cache: "force-cache" | "no-store" } or { next: { revalidate: N } }',
      },
      schema: [],
    },
    create(context) {
      return {
        CallExpression(node) {
          // Check if this is a fetch() call
          if (
            node.callee.type === 'Identifier' &&
            node.callee.name === 'fetch' &&
            node.arguments.length > 0
          ) {
            // Check if there's a second argument (options object)
            const optionsArg = node.arguments[1];
            
            if (!optionsArg) {
              // No options object at all
              context.report({
                node,
                messageId: 'missingCacheOption',
              });
              return;
            }

            // Check if the options object is an ObjectExpression
            if (optionsArg.type !== 'ObjectExpression') {
              // Options are dynamic or from a variable - we can't statically validate.
              // Design decision: Allow dynamic options to avoid false positives.
              // Developers are trusted to include cache policies in dynamic option objects.
              // Example: const opts = { cache: 'no-store', ...otherOptions }; fetch(url, opts);
              return;
            }

            // Look for 'cache' or 'next' property
            const hasCacheProperty = optionsArg.properties.some(
              (prop) =>
                prop.type === 'Property' &&
                prop.key.type === 'Identifier' &&
                (prop.key.name === 'cache' || prop.key.name === 'next')
            );

            if (!hasCacheProperty) {
              context.report({
                node,
                messageId: 'missingCacheOption',
              });
            }
          }
        },
      };
    },
  },
};
