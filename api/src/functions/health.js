import { app } from '@azure/functions';

/**
 * Health check endpoint.
 * GET /api/health
 *
 * Returns basic service status. Use this to verify the API layer is running.
 * When you're ready to add real endpoints (e.g., SharePoint proxy, Power BI
 * embed token generator), follow this same pattern:
 *
 *   1. Create a new file in src/functions/
 *   2. Register the route with app.http(...)
 *   3. Export the handler
 *
 * The Azure Functions v4 programming model auto-discovers all registered
 * functions — no function.json files needed.
 */
app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (request, context) => {
    context.log('Health check requested');

    return {
      status: 200,
      jsonBody: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  },
});
