import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';  // Per gestire i token JWT

const tokenCache = new Map<string, { payload: JwtPayload, expiration: number }>();

interface DbHandlerConfig {
  queryDatabaseForToken: (token: string) => Promise<boolean>;
}

interface ApiHandlerConfig {
  callExternalApiForToken: (token: string) => Promise<{ valid: boolean, userInfo?: JwtPayload }>;
}

interface MockHandlerConfig {
  callExternalApiForToken: (token: string) => Promise<{ valid: boolean, userInfo?: JwtPayload }>;
}

type HandlerType = 'db' | 'api' | 'mock';

interface MiddlewareConfig {
  handlerType: HandlerType;
  handlerConfig: DbHandlerConfig | ApiHandlerConfig;
  tokenTTL: number;
}

const security = (config: MiddlewareConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token mancante o non valido' });
      }
      
      const token = authHeader.split(' ')[1];
      const cachedToken = tokenCache.get(token);
      const now = Date.now() / 1000;

      if (cachedToken && cachedToken.expiration > now) {
        req.user = cachedToken.payload;
        return next();
      }

      let isValid = false;
      let userInfo: JwtPayload | undefined = undefined;

      if (config.handlerType === 'db') {
        const dbConfig = config.handlerConfig as DbHandlerConfig;
        isValid = await dbConfig.queryDatabaseForToken(token);
      } else if (config.handlerType === 'api') {
        const apiConfig = config.handlerConfig as ApiHandlerConfig;
        const response = await apiConfig.callExternalApiForToken(token);
        isValid = response.valid;
        if (isValid && response.userInfo) {
          userInfo = response.userInfo;
        }
      } else if (config.handlerType === 'mock') {
        const apiConfig = config.handlerConfig as ApiHandlerConfig;
        const response = await apiConfig.callExternalApiForToken(token);
        isValid = response.valid;
        if (isValid && response.userInfo) {
          userInfo = response.userInfo;
        }
      }

      if (!isValid) {
        return res.status(403).json({ error: 'Token non valido' });
      }

      const decodedToken = jwt.decode(token) as JwtPayload;
      const tokenPayload = userInfo || decodedToken;
      if (!tokenPayload) {
        return res.status(403).json({ error: 'Errore nella decodifica del token' });
      }

      tokenCache.set(token, {
        payload: tokenPayload,
        expiration: now + config.tokenTTL
      });

      req.user = tokenPayload;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Errore del server durante la verifica del token' });
    }
  };
};

const authorize = (requiredRole: string, requiredTenant: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Utente non autenticato' });
    }

    const { role, tenant } = user;
    if (role !== requiredRole || tenant !== requiredTenant) {
      return res.status(403).json({ error: 'Permessi insufficienti' });
    }

    next();
  };
};

export { security, authorize };
