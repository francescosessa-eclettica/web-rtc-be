import * as websocket from "ws";
import { Server } from 'http';
import * as handler from "./class/websockethandler";
import * as express from 'express';


export default class WSSignaling {
  server: Server;
  wss: websocket.Server;

  constructor(server: Server, mode: string, app: express.Application) {
    this.server = server;
    this.wss = new websocket.Server({ server });
    handler.reset(mode);

    app.get('/getAllConnections', (req, res) => {
      const tenantName  = req.query.tenantName;
      const tenantNameString = typeof tenantName === 'string' ? tenantName : null;
      res.json(handler.getAllConnectionsForTenant(tenantNameString));
    });

    this.wss.on('connection', (ws: WebSocket) => {

      handler.add(ws);

      ws.onclose = (): void => {
        handler.remove(ws);
      };

      ws.onmessage = (event: MessageEvent): void => {

        // type: connect, disconnect JSON Schema
        // connectionId: connect or disconnect connectionId

        // type: offer, answer, candidate JSON Schema
        // from: from connection id
        // to: to connection id
        // data: any message data structure

        const msg = JSON.parse(event.data);
        if (!msg || !this) {
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
}
