import Offer from './offer';
import Answer from './answer';
import Candidate from './candidate';

let isPrivate: boolean;

let isSecure = false;

// [{sessonId:[connectionId,...]}]
const clients: Map<WebSocket, Set<string>> = new Map<WebSocket, Set<string>>();

// [{connectionId:[sessionId1, sessionId2]}]
const connectionPair: Map<string, [WebSocket, WebSocket]> = new Map<string, [WebSocket, WebSocket]>();

function getOrCreateConnectionIds(session: WebSocket): Set<string> {
  let connectionIds = null;
  if (!clients.has(session)) {
    connectionIds = new Set<string>();
    clients.set(session, connectionIds);
  }
  connectionIds = clients.get(session);
  return connectionIds;
}

function setSecure(secure: boolean): void {
  isSecure = secure;
}

function reset(mode: string): void {
  isPrivate = mode == "private";
}

function add(ws: WebSocket): void {
  clients.set(ws, new Set<string>());
}

function remove(ws: WebSocket): void {
  const connectionIds = clients.get(ws);
  connectionIds.forEach(connectionId => {
    const pair = connectionPair.get(connectionId);
    if (pair) {
      const otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
      if (otherSessionWs) {
        otherSessionWs.send(JSON.stringify({ type: "disconnect", connectionId: connectionId }));
      }
    }
    connectionPair.delete(connectionId);
  });

  clients.delete(ws);
}

function checkToken(token: string): any {
  if(isSecure) {
    // TODO qui si deve fare la chiamata per verificare se il token è valido
    if('asdasd' == token) {
      return {user: 'pippo@yopmail.com', tenant: 'test'};
    }
    return false;
  } else {
    // TODO restituisco sempre true...
    return {user: 'pippo@yopmail.com', tenant: 'test'};
  }
}

function extractInfoFromConnectionId(connectionId: string): any {
  // TODO estrarre le info dal connection id o chiedere a servizio esterno
  if('1234test' == connectionId) {
    return {user: 'pippo@yopmail.com', tenant: 'test'};
  }
  return {user: 'pippo@yopmail.com', tenant: 'test'};
}

function checkTenant(userInfo: any, connectionId: string): boolean {
  // TODO: recuperare dal token le informazioni relative all'utente
  const ui = extractInfoFromConnectionId(connectionId);
  if(ui.user == userInfo.user && ui.tenant == userInfo.tenant) {
    return true;
  }
  return false;
}

function getAllConnectionsForTenantApi(req, res) {
  const tenantName  = req.query.tenantName;
  const tenantNameString = typeof tenantName === 'string' ? tenantName : null;
  res.json(getAllConnectionsForTenant(tenantNameString));
}

function getAllConnectionsForTenant(tenantName?: string): string[] {
  const connectionIds = [];
  connectionPair.forEach((_v, k) => {
    if(!tenantName) {
      connectionIds.push(k);
      return;
    }
    extractInfoFromConnectionId(k).tenant == tenantName && connectionIds.push(k);
  });
  return connectionIds;
}

function onConnect(ws: WebSocket, connectionId: string, token?: string): void {

  if(token) {
    const userInfo = checkToken(token);
    if(!userInfo) {
      ws.send(JSON.stringify({ type: "error", message: `${token}: Token not valid` }));
        return;
    }
    if(!checkTenant(userInfo, connectionId)){
      ws.send(JSON.stringify({ type: "error", message: `${token}: Wrong tenant` }));
        return;
    }
  }

  let polite = true;
  if (isPrivate) {
    if (connectionPair.has(connectionId)) {
      const pair = connectionPair.get(connectionId);

      if (pair[0] != null && pair[1] != null) {
        ws.send(JSON.stringify({ type: "error", message: `${connectionId}: This connection id is already used.` }));
        return;
      } else if (pair[0] != null) {
        connectionPair.set(connectionId, [pair[0], ws]);
      }
    } else {
      connectionPair.set(connectionId, [ws, null]);
      polite = false;
    }
  }

  const connectionIds = getOrCreateConnectionIds(ws);
  connectionIds.add(connectionId);
  ws.send(JSON.stringify({ type: "connect", connectionId: connectionId, polite: polite }));
}

function onDisconnect(ws: WebSocket, connectionId: string): void {
  const connectionIds = clients.get(ws);
  connectionIds.delete(connectionId);

  if (connectionPair.has(connectionId)) {
    const pair = connectionPair.get(connectionId);
    const otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
    if (otherSessionWs) {
      otherSessionWs.send(JSON.stringify({ type: "disconnect", connectionId: connectionId }));
    }
  }
  connectionPair.delete(connectionId);
  ws.send(JSON.stringify({ type: "disconnect", connectionId: connectionId }));
}

function onOffer(ws: WebSocket, message: any): void {
  const connectionId = message.connectionId as string;
  const newOffer = new Offer(message.sdp, Date.now(), false);

  if (isPrivate) {
    if (connectionPair.has(connectionId)) {
      const pair = connectionPair.get(connectionId);
      const otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
      if (otherSessionWs) {
        newOffer.polite = true;
        otherSessionWs.send(JSON.stringify({ from: connectionId, to: "", type: "offer", data: newOffer }));
      }
    }
    return;
  }

  connectionPair.set(connectionId, [ws, null]);
  clients.forEach((_v, k) => {
    if (k == ws) {
      return;
    }
    k.send(JSON.stringify({ from: connectionId, to: "", type: "offer", data: newOffer }));
  });
}

function onAnswer(ws: WebSocket, message: any): void {
  const connectionId = message.connectionId as string;
  const connectionIds = getOrCreateConnectionIds(ws);
  connectionIds.add(connectionId);
  const newAnswer = new Answer(message.sdp, Date.now());

  if (!connectionPair.has(connectionId)) {
    return;
  }

  const pair = connectionPair.get(connectionId);
  const otherSessionWs = pair[0] == ws ? pair[1] : pair[0];

  if (!isPrivate) {
    connectionPair.set(connectionId, [otherSessionWs, ws]);
  }

  otherSessionWs.send(JSON.stringify({ from: connectionId, to: "", type: "answer", data: newAnswer }));
}

function onCandidate(ws: WebSocket, message: any): void {
  const connectionId = message.connectionId;
  const candidate = new Candidate(message.candidate, message.sdpMLineIndex, message.sdpMid, Date.now());

  if (isPrivate) {
    if (connectionPair.has(connectionId)) {
      const pair = connectionPair.get(connectionId);
      const otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
      if (otherSessionWs) {
        otherSessionWs.send(JSON.stringify({ from: connectionId, to: "", type: "candidate", data: candidate }));
      }
    }
    return;
  }

  clients.forEach((_v, k) => {
    if (k === ws) {
      return;
    }
    k.send(JSON.stringify({ from: connectionId, to: "", type: "candidate", data: candidate }));
  });
}

export { reset, add, remove, onConnect, onDisconnect, onOffer, onAnswer, onCandidate, getAllConnectionsForTenantApi, getAllConnectionsForTenant };
