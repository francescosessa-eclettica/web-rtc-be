"use strict";
// import { Pool } from 'pg';  // Esempio con PostgreSQL
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryDatabaseForToken = void 0;
// // Funzione che interroga il database per verificare il token
// export const queryDatabaseForToken = async (token: string): Promise<boolean> => {
//   const pool = new Pool();  // Configurazione della connessione al DB
//   const query = 'SELECT COUNT(*) FROM user_tokens WHERE token = $1';
//   const result = await pool.query(query, [token]);
//   return result.rows[0].count > 0;
// };
// import mariadb from 'mariadb';
var mariadb = require('mariadb');
// Funzione che interroga il database per verificare il token
var queryDatabaseForToken = function (token) { return __awaiter(void 0, void 0, void 0, function () {
    var pool, connection, query, rows, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pool = mariadb.createPool({
                    host: 'localhost',
                    user: 'root',
                    password: 'password',
                    database: 'your_db_name',
                    connectionLimit: 5 // Limita il numero di connessioni simultanee
                });
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, 5, 6]);
                return [4 /*yield*/, pool.getConnection()];
            case 2:
                connection = _a.sent();
                query = 'SELECT COUNT(*) as count FROM user_tokens WHERE token = ?';
                return [4 /*yield*/, connection.query(query, [token])];
            case 3:
                rows = _a.sent();
                return [2 /*return*/, rows[0].count > 0];
            case 4:
                err_1 = _a.sent();
                console.error('Errore nella query del database:', err_1);
                return [2 /*return*/, false];
            case 5:
                if (connection)
                    connection.release(); // Rilascia la connessione
                return [7 /*endfinally*/];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.queryDatabaseForToken = queryDatabaseForToken;
//# sourceMappingURL=db-handler.js.map