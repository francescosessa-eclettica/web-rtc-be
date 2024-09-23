"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var handler = require("./class/websockethandler");
var router = express.Router();
// router.use(security({
//     handlerType: 'db',
//     handlerConfig: { queryDatabaseForToken },
//     tokenTTL: 300  // TTL di 300 secondi
//   }));
//   router.get('/connections', authorize('admin', 'tenant1'), handler.getAllConnectionsForTenantApi);
router.get('/connections', handler.getAllConnectionsForTenantApi);
exports.default = router;
//# sourceMappingURL=backoffice.js.map