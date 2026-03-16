import axios from 'axios';
import { AuthManager } from './AuthManager.js';
import { SessionManager } from './SessionManager.js';
import { InvoiceManager } from './InvoiceManager.js';
import { CertificateManager } from './CertificateManager.js';
import { PermissionManager } from './PermissionManager.js';

/**
 * Main KSeF API Client.
 */
export class KSeFClient {
    #transport;
    #config;
    #auth;
    #sessions;
    #invoices;
    #certificates;
    #permissions;

    /**
     /**
      * @param {object} config
      * @param {string} [config.baseUrl] - API base URL (overrides test flag)
      * @param {boolean} [config.test=true] - Use test environment if true, production if false
      * @param {string} [config.token] - Access token for authentication
      * @param {string} [config.nip] - NIP for automatic login
      * @param {string} [config.ksefToken] - Raw KSeF token for automatic login
      */
     constructor(config = {}) {
         const isTest = config.test !== false;
         const defaultUrl = isTest ? 'https://api-test.ksef.mf.gov.pl/v2' : 'https://api.ksef.mf.gov.pl/v2';

         this.#config = {
             baseUrl: defaultUrl,
             ...config,
         };

         this.#transport = axios.create({
             baseURL: this.#config.baseUrl,
             headers: {
                 'Content-Type': 'application/json',
                 Accept: 'application/json',
             },
         });

         // Add error interceptor to extract KSeF specific error messages
         this.#transport.interceptors.response.use(
             (response) => response,
             (error) => {
                 const ksefError = error.response?.data?.exception;
                 if (ksefError) {
                     const msg = ksefError.exceptionDetailList
                         ? `${ksefError.exceptionDescription}: ${ksefError.exceptionDetailList.map((d) => d.description).join(', ')}`
                         : ksefError.exceptionDescription;
                     error.message = `KSeF [${ksefError.exceptionCode}] ${msg}`;
                 }
                 return Promise.reject(error);
             },
         );

         this.#auth = new AuthManager(this.#transport);

        this.#sessions = new SessionManager(this.#transport);
        this.#invoices = new InvoiceManager(this.#transport);
        this.#certificates = new CertificateManager(this.#transport);
        this.#permissions = new PermissionManager(this.#transport);

        if (this.#config.token) {
            this.setToken(this.#config.token);
        }
    }

    /**
     * Authenticate using NIP and KSeF Token.
     * Automatically fetches public key and handles the full auth flow.
     * @param {string} [nip] - If not provided, uses nip from config
     * @param {string} [token] - If not provided, uses ksefToken from config
     * @returns {Promise<object>}
     */
    async login(nip = this.#config.nip, token = this.#config.ksefToken) {
        if (!nip || !token) {
            throw new Error('NIP and Token are required for login.');
        }

        // 1. Get MF public keys
        const keys = await this.certificates.getPublicKeys();
        const encryptionKey = keys.find((k) => k.usage.includes('KsefTokenEncryption'));

        if (!encryptionKey) {
            throw new Error('Could not find MF public key for token encryption.');
        }

        // 2. Perform login flow
        const result = await this.auth.loginByToken(nip, token, encryptionKey.certificate);

        // 3. Set token in transport
        this.setToken(result.accessToken.token);

        return result;
    }

    /**
     * Get information about the current active session.
     * @returns {Promise<object|null>}
     */
    async sessionStatus() {
        const data = await this.sessions.listActive();
        return data.items?.find((item) => item.isCurrent) || null;
    }

    /**
     * Set the bearer token for subsequent requests.
     * @param {string} token
     */
    setToken(token) {
        this.#transport.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    /**
     * Internal transport for managers.
     */
    get transport() {
        return this.#transport;
    }

    /**
     * Auth manager.
     * @returns {AuthManager}
     */
    get auth() {
        return this.#auth;
    }

    /**
     * Session manager.
     * @returns {SessionManager}
     */
    get sessions() {
        return this.#sessions;
    }

    /**
     * Invoice manager.
     * @returns {InvoiceManager}
     */
    get invoices() {
        return this.#invoices;
    }

    /**
     * Certificate manager.
     * @returns {CertificateManager}
     */
    get certificates() {
        return this.#certificates;
    }

    /**
     * Permission manager.
     * @returns {PermissionManager}
     */
    get permissions() {
        return this.#permissions;
    }
}
