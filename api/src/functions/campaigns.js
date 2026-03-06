import { app } from '@azure/functions';

/**
 * Campaign data API stub.
 *
 * These endpoints are placeholders for when you connect a real data store
 * (SharePoint Lists via Graph API, Azure SQL, Cosmos DB, etc.).
 *
 * Currently returns mock responses so you can build out the frontend
 * API integration layer before the backend is ready.
 *
 * Auth note: These routes require authentication via staticwebapp.config.json
 * (allowedRoles: ["authenticated"]). The user's Azure AD identity is available
 * in the x-ms-client-principal header, which Azure Static Web Apps injects
 * automatically.
 */

/** GET /api/campaigns — List campaigns (stubbed) */
app.http('campaigns-list', {
  methods: ['GET'],
  authLevel: 'anonymous', // Auth enforced by Static Web Apps config
  route: 'campaigns',
  handler: async (request, context) => {
    // TODO: Replace with SharePoint Lists query via Graph API
    // const graphClient = getGraphClient(request);
    // const items = await graphClient.api('/sites/{site-id}/lists/{list-id}/items').get();

    const clientPrincipal = parseClientPrincipal(request);
    context.log(`Campaigns list requested by: ${clientPrincipal?.userDetails || 'anonymous'}`);

    return {
      status: 200,
      jsonBody: {
        message: 'Campaign API stub — connect your data store to return real data',
        user: clientPrincipal?.userDetails || null,
        data: [],
        total: 0,
      },
    };
  },
});

/** GET /api/campaigns/:id — Get single campaign (stubbed) */
app.http('campaigns-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'campaigns/{id}',
  handler: async (request, context) => {
    const id = request.params.id;
    context.log(`Campaign ${id} requested`);

    return {
      status: 404,
      jsonBody: {
        message: `Campaign ${id} not found — API stub, no data store connected`,
      },
    };
  },
});

/**
 * Parse the Azure Static Web Apps client principal header.
 * This header is automatically injected by the platform when a user
 * is authenticated via Azure AD.
 */
function parseClientPrincipal(request) {
  const header = request.headers.get('x-ms-client-principal');
  if (!header) return null;

  try {
    const buffer = Buffer.from(header, 'base64');
    return JSON.parse(buffer.toString('utf-8'));
  } catch {
    return null;
  }
}
