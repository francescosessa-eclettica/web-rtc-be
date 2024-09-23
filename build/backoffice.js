"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var handler = require("./class/websockethandler");
var backoffice_security_1 = require("./backoffice-security/backoffice-security");
var mock_handler_1 = require("./backoffice-security/mock-handler");
var router = express.Router();
// router.use(security({
//     handlerType: 'db',
//     handlerConfig: { queryDatabaseForToken },
//     tokenTTL: 300  // TTL di 300 secondi
//   }));
router.use((0, backoffice_security_1.security)({
    handlerType: 'api',
    handlerConfig: { callExternalApiForToken: mock_handler_1.mockHandlerForToken },
    tokenTTL: 300 // TTL di 300 secondi
}));
router.get('/connections', (0, backoffice_security_1.authorize)('admin', 'tenant1'), handler.getAllConnectionsForTenantApi);
//   router.get('/connections', handler.getAllConnectionsForTenantApi);
exports.default = router;
//# sourceMappingURL=backoffice.js.map