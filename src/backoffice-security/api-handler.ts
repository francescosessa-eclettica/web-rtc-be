import axios from 'axios';
import { JwtPayload } from 'jsonwebtoken'; // Per gestire i token JWT

interface ApiHandlerConfig {
  apiUrl: string;
  apiPath: string;
}

// Funzione che chiama un'API esterna per verificare il token
export const callExternalApiForToken = async (token: string, config: ApiHandlerConfig): Promise<{ valid: boolean, userInfo?: JwtPayload }> => {
  const { apiUrl, apiPath } = config;

  try {
    const response = await axios.post(`${apiUrl}${apiPath}`, { token });

    return {
      valid: response.data.valid,
      userInfo: response.data.userInfo
    };
  } catch (error) {
    console.error('Errore nella chiamata API:', error);
    return { valid: false };
  }
};
