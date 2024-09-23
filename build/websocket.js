"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var websocket = require("ws");
var handler = require("./class/websockethandler");
var WSSignaling = /** @class */ (function () {
    function WSSignaling(server, mode, app) {
        var _this = this;
        this.server = server;
        console.log(JSON.stringify(server));
        this.wss = new websocket.Server({ server: server });
        handler.reset(mode);
        app.get('/getAllConnections', function (req, res) {
            var tenantName = req.query.tenantName;
            var tenantNameString = typeof tenantName === 'string' ? tenantName : null;
            res.json(handler.getAllConnectionsForTenant(tenantNameString));
        });
        this.wss.on('connection', function (ws) {
            handler.add(ws);
            ws.onclose = function () {
                handler.remove(ws);
            };
            ws.onmessage = function (event) {
                // type: connect, disconnect JSON Schema
                // connectionId: connect or disconnect connectionId
                // type: offer, answer, candidate JSON Schema
                // from: from connection id
                // to: to connection id
                // data: any message data structure
                var msg = JSON.parse(event.data);
                if (!msg || !_this) {
                    return;
                }
                console.log(msg);
                switch (msg.type) {
                    case "connect":
                        handler.onConnect(ws, msg.connectionId, msg.token);
                        break;
                    case "disconnect":
                        handler.onDisconnect(ws, msg.connectionId);
                        break;
                    case "offer":
                        handler.onOffer(ws, msg.data);
                        break;
                    case "answer":
                        handler.onAnswer(ws, msg.data);
                        break;
                    case "candidate":
                        handler.onCandidate(ws, msg.data);
                        break;
                    default:
                        break;
                }
            };
        });
    }
    return WSSignaling;
}());
exports.default = WSSignaling;
//# sourceMappingURL=websocket.js.map