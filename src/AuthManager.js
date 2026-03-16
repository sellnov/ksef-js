import crypto from 'node:crypto';

/**
 * Handles authentication processes for KSeF.
 */
export class AuthManager {
    #transport;

    /**
     * @param {import('axios').AxiosInstance} transport
     */
    constructor(transport) {
        this.#transport = transport;
    }

    /**
     * High-level login method using KSeF Token.
     * Handles challenge, encryption and token redemption.
     * @param {string} nip
     * @param {string} token - Raw KSeF token from portal
     * @param {string} certBase64 - MF Public key certificate in Base64
     * @returns {Promise<object>} - Object containing access and refresh tokens
     */
    async loginByToken(nip, token, certBase64) {
        // 1. Get challenge
        const { challenge, timestampMs } = await this.challenge(nip);

        // 2. Encrypt token
        const encryptedToken = TokenEncrypter.encrypt(token, timestampMs, certBase64);

        // 3. Init session
        const initResponse = await this.initToken(challenge, nip, encryptedToken);
        const operationToken = initResponse.authenticationToken.token;

        // 4. Wait for success status
        await this.#waitForAuth(initResponse.referenceNumber, operationToken);

        // 5. Redeem tokens
        return await this.redeemToken(operationToken);
    }

    /**
     * Get an authentication challenge.
     * @returns {Promise<object>}
     */
    async challenge(identifier, type = 'on-nip') {
        const response = await this.#transport.post('/auth/challenge', {
            contextIdentifier: {
                type: type === 'on-nip' ? 'Nip' : type,
                value: identifier,
            },
        });
        return response.data;
    }

    /**
     * Initialize authentication with a KSeF token.
     * @param {string} challenge
     * @param {string} identifier
     * @param {string} encryptedToken - Base64 encoded encrypted token|timestamp
     * @returns {Promise<object>}
     */
    async initToken(challenge, identifier, encryptedToken) {
        const response = await this.#transport.post('/auth/ksef-token', {
            challenge,
            contextIdentifier: {
                type: 'Nip',
                value: identifier,
            },
            encryptedToken,
        });
        return response.data;
    }

    /**
     * Redeem authentication tokens (access and refresh).
     * @param {string} operationToken - The token received from initToken.
     * @returns {Promise<object>}
     */
    async redeemToken(operationToken) {
        const response = await this.#transport.post('/auth/token/redeem', null, {
            headers: {
                Authorization: `Bearer ${operationToken}`,
            },
        });
        return response.data;
    }

    /**
     * Refresh an access token.
     * @param {string} refreshToken
     * @returns {Promise<object>}
     */
    async refreshToken(refreshToken) {
        const response = await this.#transport.post('/auth/token/refresh', null, {
            headers: {
                Authorization: `Bearer ${refreshToken}`,
            },
        });
        return response.data;
    }

    /**
     * Get status of an authentication operation.
     * @param {string} referenceNumber
     * @param {string} operationToken
     * @returns {Promise<object>}
     */
    async status(referenceNumber, operationToken) {
        const response = await this.#transport.get(`/auth/${referenceNumber}`, {
            headers: {
                Authorization: `Bearer ${operationToken}`,
            },
        });
        return response.data;
    }

    async #waitForAuth(referenceNumber, operationToken, interval = 1000, timeout = 30000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const data = await this.status(referenceNumber, operationToken);
            if (data.status.code === 200) return data;
            if (data.status.code >= 400) {
                throw new Error(`KSeF Auth Error: ${data.status.description} (${data.status.details?.join(', ')})`);
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
        throw new Error('KSeF Auth Timeout');
    }
}

/**
 * Internal utility for token encryption.
 */
class TokenEncrypter {
    /**
     * @param {string} token
     * @param {number} timestampMs
     * @param {string} certBase64
     * @returns {string} Base64 encrypted token
     */
    static encrypt(token, timestampMs, certBase64) {
        const data = Buffer.from(`${token}|${timestampMs}`);
        const publicKey = crypto.createPublicKey(`-----BEGIN CERTIFICATE-----\n${certBase64}\n-----END CERTIFICATE-----`);

        const encrypted = crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            data,
        );

        return encrypted.toString('base64');
    }
}
