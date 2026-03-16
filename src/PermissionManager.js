/**
 * Handles KSeF permissions management.
 */
export class PermissionManager {
    #transport;

    /**
     * @param {import('axios').AxiosInstance} transport
     */
    constructor(transport) {
        this.#transport = transport;
    }

    /**
     * Grant permissions to a person.
     * @param {object} request
     * @returns {Promise<object>}
     */
    async grantToPerson(request) {
        const response = await this.#transport.post('/permissions/persons/grants', request);
        return response.data;
    }

    /**
     * Grant permissions to an entity.
     * @param {object} request
     * @returns {Promise<object>}
     */
    async grantToEntity(request) {
        const response = await this.#transport.post('/permissions/entities/grants', request);
        return response.data;
    }

    /**
     * Revoke permissions by ID.
     * @param {string} permissionId
     * @returns {Promise<object>}
     */
    async revoke(permissionId) {
        const response = await this.#transport.delete(`/permissions/common/grants/${permissionId}`);
        return response.data;
    }

    /**
     * Get operation status for permissions.
     * @param {string} referenceNumber
     * @returns {Promise<object>}
     */
    async operationStatus(referenceNumber) {
        const response = await this.#transport.get(`/permissions/operations/${referenceNumber}`);
        return response.data;
    }

    /**
     * Check attachment permission status.
     * @returns {Promise<object>}
     */
    async checkAttachmentPermission() {
        const response = await this.#transport.get('/permissions/attachments/status');
        return response.data;
    }
}
