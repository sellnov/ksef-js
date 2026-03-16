/**
 * Handles KSeF certificate operations.
 */
export class CertificateManager {
    #transport;

    /**
     * @param {import('axios').AxiosInstance} transport
     */
    constructor(transport) {
        this.#transport = transport;
    }

    /**
     * Get certificate limits.
     * @returns {Promise<object>}
     */
    async limits() {
        const response = await this.#transport.get('/certificates/limits');
        return response.data;
    }

    /**
     * Get data for certificate enrollment (CSR).
     * @returns {Promise<object>}
     */
    async enrollmentData() {
        const response = await this.#transport.get('/certificates/enrollments/data');
        return response.data;
    }

    /**
     * Send certificate enrollment request (CSR).
     * @param {object} request
     * @returns {Promise<object>}
     */
    async enroll(request) {
        const response = await this.#transport.post('/certificates/enrollments', request);
        return response.data;
    }

    /**
     * Get certificate enrollment status.
     * @param {string} referenceNumber
     * @returns {Promise<object>}
     */
    async enrollmentStatus(referenceNumber) {
        const response = await this.#transport.get(`/certificates/enrollments/${referenceNumber}`);
        return response.data;
    }

    /**
     * Retrieve certificates by serial numbers.
     * @param {string[]} serialNumbers
     * @returns {Promise<object>}
     */
    async retrieve(serialNumbers) {
        const response = await this.#transport.post('/certificates/retrieve', {
            certificateSerialNumbers: serialNumbers,
        });
        return response.data;
    }

    /**
     * Revoke a certificate.
     * @param {string} serialNumber
     * @param {object} request
     * @returns {Promise<void>}
     */
    async revoke(serialNumber, request = {}) {
        await this.#transport.post(`/certificates/${serialNumber}/revoke`, request);
    }

    /**
     * Query certificates.
     * @param {object} criteria
     * @param {object} params
     * @returns {Promise<object>}
     */
    async query(criteria = {}, params = {}) {
        const response = await this.#transport.post('/certificates/query', criteria, { params });
        return response.data;
    }

    /**
     * Get MF public key certificates.
     * @returns {Promise<object>}
     */
    async getPublicKeys() {
        const response = await this.#transport.get('/security/public-key-certificates');
        return response.data;
    }
}
