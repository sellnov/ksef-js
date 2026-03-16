/**
 * Handles KSeF sessions (online and batch).
 */
export class SessionManager {
    #transport;

    /**
     * @param {import('axios').AxiosInstance} transport
     */
    constructor(transport) {
        this.#transport = transport;
    }

    /**
     * Open an online session.
     * @param {object} request
     * @returns {Promise<object>}
     */
    async openOnline(request) {
        const response = await this.#transport.post('/sessions/online', request);
        return response.data;
    }

    /**
     * Get session status.
     * @param {string} referenceNumber
     * @returns {Promise<object>}
     */
    async status(referenceNumber) {
        const response = await this.#transport.get(`/sessions/${referenceNumber}`);
        return response.data;
    }

    /**
     * Get session invoices.
     * @param {string} referenceNumber
     * @param {object} params
     * @returns {Promise<object>}
     */
    async invoices(referenceNumber, params = {}) {
        const response = await this.#transport.get(`/sessions/${referenceNumber}/invoices`, { params });
        return response.data;
    }

    /**
     * Terminate current session.
     * @returns {Promise<void>}
     */
    async terminateCurrent() {
        await this.#transport.delete('/auth/sessions/current');
    }

    /**
     * Terminate session by reference number.
     * @param {string} referenceNumber
     * @returns {Promise<void>}
     */
    async terminate(referenceNumber) {
        await this.#transport.delete(`/auth/sessions/${referenceNumber}`);
    }

    /**
     * List active sessions.
     * @param {object} params
     * @returns {Promise<object>}
     */
    async listActive(params = {}) {
        const response = await this.#transport.get('/auth/sessions', { params });
        return response.data;
    }
}
