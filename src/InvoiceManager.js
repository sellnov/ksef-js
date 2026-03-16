/**
 * Handles KSeF invoice operations (sending, querying, downloading).
 */
export class InvoiceManager {
    #transport;

    /**
     * @param {import('axios').AxiosInstance} transport
     */
    constructor(transport) {
        this.#transport = transport;
    }

    /**
     * Send an invoice in online mode.
     * @param {string} sessionToken
     * @param {object} invoiceData
     * @returns {Promise<object>}
     */
    async sendOnline(sessionToken, invoiceData) {
        const response = await this.#transport.put('/invoices/send', invoiceData, {
            headers: {
                'Session-Token': sessionToken,
            },
        });
        return response.data;
    }

    /**
     * Query invoice metadata.
     * @param {object} filters
     * @param {object} params
     * @returns {Promise<object>}
     */
    async queryMetadata(filters, params = {}) {
        const response = await this.#transport.post('/invoices/query/metadata', filters, { params });
        return response.data;
    }

    /**
     * Download an invoice by KSeF number.
     * @param {string} ksefNumber
     * @returns {Promise<string>} - XML content
     */
    async download(ksefNumber) {
        const response = await this.#transport.get(`/invoices/ksef/${ksefNumber}`, {
            responseType: 'text',
        });
        return response.data;
    }

    /**
     * Export a batch of invoices.
     * @param {object} request
     * @returns {Promise<object>}
     */
    async export(request) {
        const response = await this.#transport.post('/invoices/exports', request);
        return response.data;
    }

    /**
     * Get export status.
     * @param {string} referenceNumber
     * @returns {Promise<object>}
     */
    async exportStatus(referenceNumber) {
        const response = await this.#transport.get(`/invoices/exports/${referenceNumber}`);
        return response.data;
    }
}
