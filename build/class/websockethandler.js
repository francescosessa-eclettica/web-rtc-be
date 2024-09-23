"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllConnectionsForTenant = exports.getAllConnectionsForTenantApi = exports.onCandidate = exports.onAnswer = exports.onOffer = exports.onDisconnect = exports.onConnect = exports.remove = exports.add = exports.reset = void 0;
var offer_1 = require("./offer");
var answer_1 = require("./answer");
var candidate_1 = require("./candidate");
var isPrivate;
var isSecure = false;
// [{sessonId:[connectionId,...]}]
var clients = new Map();
// [{connectionId:[sessionId1, sessionId2]}]
var connectionPair = new Map();
function getOrCreateConnectionIds(session) {
    var connectionIds = null;
    if (!clients.has(session)) {
        connectionIds = new Set();
        clients.set(session, connectionIds);
    }
    connectionIds = clients.get(session);
    return connectionIds;
}
function setSecure(secure) {
    isSecure = secure;
}
function reset(mode) {
    isPrivate = mode == "private";
}
exports.reset = reset;
function add(ws) {
    clients.set(ws, new Set());
}
exports.add = add;
function remove(ws) {
    var connectionIds = clients.get(ws);
    connectionIds.forEach(function (connectionId) {
        var pair = connectionPair.get(connectionId);
        if (pair) {
            var otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
            if (otherSessionWs) {
                otherSessionWs.send(JSON.stringify({ type: "disconnect", connectionId: connectionId }));
            }
        }
        connectionPair.delete(connectionId);
    });
    clients.delete(ws);
}
exports.remove = remove;
function checkToken(token) {
    if (isSecure) {
        // TODO qui si deve fare la chiamata per verificare se il token è valido
        if ('asdasd' == token) {
            return { user: 'pippo@yopmail.com', tenant: 'test' };
        }
        return false;
    }
    else {
        // TODO restituisco sempre true...
        return { user: 'pippo@yopmail.com', tenant: 'test' };
    }
}
function extractInfoFromConnectionId(connectionId) {
    // TODO estrarre le info dal connection id o chiedere a servizio esterno
    if ('1234test' == connectionId) {
        return { user: 'pippo@yopmail.com', tenant: 'test' };
    }
    return { user: 'pippo@yopmail.com', tenant: 'test' };
}
function checkTenant(userInfo, connectionId) {
    // TODO: recuperare dal token le informazioni relative all'utente
    var ui = extractInfoFromConnectionId(connectionId);
    if (ui.user == userInfo.user && ui.tenant == userInfo.tenant) {
        return true;
    }
    return false;
}
function getAllConnectionsForTenantApi(req, res) {
    var tenantName = req.query.tenantName;
    var tenantNameString = typeof tenantName === 'string' ? tenantName : null;
    res.json(getAllConnectionsForTenant(tenantNameString));
}
exports.getAllConnectionsForTenantApi = getAllConnectionsForTenantApi;
function getAllConnectionsForTenant(tenantName) {
    var connectionIds = [];
    connectionPair.forEach(function (_v, k) {
        if (!tenantName) {
            connectionIds.push(k);
            return;
        }
        extractInfoFromConnectionId(k).tenant == tenantName && connectionIds.push(k);
    });
    return connectionIds;
}
exports.getAllConnectionsForTenant = getAllConnectionsForTenant;
function onConnect(ws, connectionId, token) {
    if (token) {
        var userInfo = checkToken(token);
        if (!userInfo) {
            ws.send(JSON.stringify({ type: "error", message: "".concat(token, ": Token not valid") }));
            return;
        }
        if (!checkTenant(userInfo, connectionId)) {
            ws.send(JSON.stringify({ type: "error", message: "".concat(token, ": Wrong tenant") }));
            return;
        }
    }
    var polite = true;
    if (isPrivate) {
        if (connectionPair.has(connectionId)) {
            var pair = connectionPair.get(connectionId);
            if (pair[0] != null && pair[1] != null) {
                ws.send(JSON.stringify({ type: "error", message: "".concat(connectionId, ": This connection id is already used.") }));
                return;
            }
            else if (pair[0] != null) {
                connectionPair.set(connectionId, [pair[0], ws]);
            }
        }
        else {
            connectionPair.set(connectionId, [ws, null]);
            polite = false;
        }
    }
    var connectionIds = getOrCreateConnectionIds(ws);
    connectionIds.add(connectionId);
    ws.send(JSON.stringify({ type: "connect", connectionId: connectionId, polite: polite }));
}
exports.onConnect = onConnect;
function onDisconnect(ws, connectionId) {
    var connectionIds = clients.get(ws);
    connectionIds.delete(connectionId);
    if (connectionPair.has(connectionId)) {
        var pair = connectionPair.get(connectionId);
        var otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
        if (otherSessionWs) {
            otherSessionWs.send(JSON.stringify({ type: "disconnect", connectionId: connectionId }));
        }
    }
    connectionPair.delete(connectionId);
    ws.send(JSON.stringify({ type: "disconnect", connectionId: connectionId }));
}
exports.onDisconnect = onDisconnect;
function onOffer(ws, message) {
    var connectionId = message.connectionId;
    var newOffer = new offer_1.default(message.sdp, Date.now(), false);
    if (isPrivate) {
        if (connectionPair.has(connectionId)) {
            var pair = connectionPair.get(connectionId);
            var otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
            if (otherSessionWs) {
                newOffer.polite = true;
                otherSessionWs.send(JSON.stringify({ from: connectionId, to: "", type: "offer", data: newOffer }));
            }
        }
        return;
    }
    connectionPair.set(connectionId, [ws, null]);
    clients.forEach(function (_v, k) {
        if (k == ws) {
            return;
        }
        k.send(JSON.stringify({ from: connectionId, to: "", type: "offer", data: newOffer }));
    });
}
exports.onOffer = onOffer;
function onAnswer(ws, message) {
    var connectionId = message.connectionId;
    var connectionIds = getOrCreateConnectionIds(ws);
    connectionIds.add(connectionId);
    var newAnswer = new answer_1.default(message.sdp, Date.now());
    if (!connectionPair.has(connectionId)) {
        return;
    }
    var pair = connectionPair.get(connectionId);
    var otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
    if (!isPrivate) {
        connectionPair.set(connectionId, [otherSessionWs, ws]);
    }
    otherSessionWs.send(JSON.stringify({ from: connectionId, to: "", type: "answer", data: newAnswer }));
}
exports.onAnswer = onAnswer;
function onCandidate(ws, message) {
    var connectionId = message.connectionId;
    var candidate = new candidate_1.default(message.candidate, message.sdpMLineIndex, message.sdpMid, Date.now());
    if (isPrivate) {
        if (connectionPair.has(connectionId)) {
            var pair = connectionPair.get(connectionId);
            var otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
            if (otherSessionWs) {
                otherSessionWs.send(JSON.stringify({ from: connectionId, to: "", type: "candidate", data: candidate }));
            }
        }
        return;
    }
    clients.forEach(function (_v, k) {
        if (k === ws) {
            return;
        }
        k.send(JSON.stringify({ from: connectionId, to: "", type: "candidate", data: candidate }));
    });
}
exports.onCandidate = onCandidate;
//# sourceMappingURL=websockethandler.js.map