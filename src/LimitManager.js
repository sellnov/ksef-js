/**
 * Handles KSeF limits and rate-limits information.
 */
export class LimitManager {
    #transport;

    /**
     * @param {import('axios').AxiosInstance} transport
     */
    constructor(transport) {
        this.#transport = transport;
    }

    /**
     * Get limits for the current context.
     * @returns {Promise<object>}
     */
    async context() {
        const response = await this.#transport.get('/limits/context');
        return response.data;
    }

    /**
     * Get limits for the current subject.
     * @returns {Promise<object>}
     */
    async subject() {
        const response = await this.#transport.get('/limits/subject');
        return response.data;
    }

    /**
     * Get current API rate limits.
     * @returns {Promise<object>}
     */
    async rateLimits() {
        const response = await this.#transport.get('/rate-limits');
        return response.data;
    }
}
