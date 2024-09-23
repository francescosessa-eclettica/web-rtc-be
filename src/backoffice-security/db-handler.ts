// import { Pool } from 'pg';  // Esempio con PostgreSQL

// // Funzione che interroga il database per verificare il token
// export const queryDatabaseForToken = async (token: string): Promise<boolean> => {
//   const pool = new Pool();  // Configurazione della connessione al DB
//   const query = 'SELECT COUNT(*) FROM user_tokens WHERE token = $1';
  
//   const result = await pool.query(query, [token]);
//   return result.rows[0].count > 0;
// };


// import mariadb from 'mariadb';
const mariadb = require('mariadb');

// Funzione che interroga il database per verificare il token
export const queryDatabaseForToken = async (token: string): Promise<boolean> => {
  const pool = mariadb.createPool({
    host: 'localhost', // Configura il tuo host
    user: 'root',      // Configura il tuo user
    password: 'password', // Configura la password
    database: 'your_db_name', // Nome del database
    connectionLimit: 5  // Limita il numero di connessioni simultanee
  });

  let connection;
  try {
    connection = await pool.getConnection();
    const query = 'SELECT COUNT(*) as count FROM user_tokens WHERE token = ?';
    const rows = await connection.query(query, [token]);

    return rows[0].count > 0;
  } catch (err) {
    console.error('Errore nella query del database:', err);
    return false;
  } finally {
    if (connection) connection.release(); // Rilascia la connessione
  }
};
