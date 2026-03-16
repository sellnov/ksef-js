/**
 * Handles KSeF batch session operations.
 */
export class BatchManager {
    #transport;

    /**
     * @param {import('axios').AxiosInstance} transport
     */
    constructor(transport) {
        this.#transport = transport;
    }

    /**
     * Open a batch session.
     * @param {object} request
     * @returns {Promise<object>}
     */
    async open(request) {
        const response = await this.#transport.post('/sessions/batch', request);
        return response.data;
    }

    /**
     * Close a batch session.
     * @param {string} referenceNumber
     * @returns {Promise<object>}
     */
    async close(referenceNumber) {
        const response = await this.#transport.post(`/sessions/batch/${referenceNumber}/close`);
        return response.data;
    }

    /**
     * Upload batch part. This is usually done via a URL received during 'open'.
     * @param {string} url
     * @param {Buffer|Uint8Array|Blob} data
     * @param {object} headers
     * @returns {Promise<void>}
     */
    async uploadPart(url, data, headers = {}) {
        // We use direct axios call for external storage URL if needed,
        // but often the transport can handle it if relative.
        // However, KSeF batch URLs are usually full Azure Blob Storage URLs.
        const response = await this.#transport.put(url, data, {
            headers: {
                ...headers,
                'Content-Type': 'application/octet-stream',
            },
            // If it's a full URL, we might want to bypass the base transport headers
            // but for simplicity we assume the caller knows what they are doing.
        });
        return response.data;
    }
}
