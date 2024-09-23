import * as express from 'express';
import * as handler from "./class/websockethandler";
import { authorize, security } from './backoffice-security/backoffice-security';
import { queryDatabaseForToken } from './backoffice-security/db-handler';
import { mockHandlerForToken } from './backoffice-security/mock-handler';



const router: express.Router = express.Router();
// router.use(security({
//     handlerType: 'db',
//     handlerConfig: { queryDatabaseForToken },
//     tokenTTL: 300  // TTL di 300 secondi
//   }));

  router.use(security({
    handlerType: 'api',  // Simula come se fosse un'API
    handlerConfig: { callExternalApiForToken: mockHandlerForToken },
    tokenTTL: 300  // TTL di 300 secondi
  }));
  router.get('/connections', authorize('admin', 'tenant1'), handler.getAllConnectionsForTenantApi);
//   router.get('/connections', handler.getAllConnectionsForTenantApi);

export default router;