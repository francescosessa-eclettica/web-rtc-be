import { JwtPayload } from 'jsonwebtoken';

// Funzione mock che simula la validazione del token e restituisce sempre lo stesso utente
export const mockHandlerForToken = async (token: string): Promise<{ valid: boolean, userInfo?: JwtPayload }> => {
  // Qualunque token venga fornito, restituisce sempre un utente valido con informazioni predefinite
  return {
    valid: true,
    userInfo: {
      username: 'pippo@yopmail.com',
      tenant: 'test',
      role: 'user',  // Puoi aggiungere altri ruoli se necessario
      iat: Math.floor(Date.now() / 1000),  // Data di emissione
    }
  };
};
