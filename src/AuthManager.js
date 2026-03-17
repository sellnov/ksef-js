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
        const encryptedToken = await TokenEncrypter.encrypt(token, timestampMs, certBase64);

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
    static async encrypt(token, timestampMs, certBase64) {
        if (!globalThis?.crypto?.subtle) {
            throw new Error('WebCrypto (crypto.subtle) is required to encrypt KSeF token.');
        }

        const data = new TextEncoder().encode(`${token}|${timestampMs}`);
        const publicKey = await importRsaOaepPublicKeyFromCertificateBase64(certBase64);
        const encrypted = await globalThis.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data);

        return bytesToBase64(new Uint8Array(encrypted));
    }
}

const bytesToBase64 = (bytes) => {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(bytes).toString('base64');
    }
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
};

const base64ToBytes = (base64) => {
    const input = String(base64);
    let normalized = '';
    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch !== '\n' && ch !== '\r' && ch !== '\t' && ch !== ' ') normalized += ch;
    }
    if (typeof Buffer !== 'undefined') {
        return new Uint8Array(Buffer.from(normalized, 'base64'));
    }
    const binary = atob(normalized);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
};

const readLength = (bytes, offset) => {
    const first = bytes[offset];
    if ((first & 0x80) === 0) return { length: first, lengthBytes: 1 };
    const count = first & 0x7f;
    let length = 0;
    for (let i = 0; i < count; i++) length = (length << 8) | bytes[offset + 1 + i];
    return { length, lengthBytes: 1 + count };
};

const readTlv = (bytes, offset) => {
    const tag = bytes[offset];
    const { length, lengthBytes } = readLength(bytes, offset + 1);
    const headerBytes = 1 + lengthBytes;
    const valueOffset = offset + headerBytes;
    const endOffset = valueOffset + length;
    return { tag, offset, valueOffset, endOffset };
};

const isSequence = (tlv) => tlv.tag === 0x30;

const RSA_ENCRYPTION_OID_BYTES = new Uint8Array([
    0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
]);

const equalsBytes = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
};

const findSpkiSequence = (bytes) => {
    const root = readTlv(bytes, 0);
    if (!isSequence(root)) throw new Error('Invalid X.509 certificate (expected SEQUENCE).');

    // Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signatureValue }
    const tbs = readTlv(bytes, root.valueOffset);
    if (!isSequence(tbs)) throw new Error('Invalid X.509 certificate (expected tbsCertificate SEQUENCE).');

    // Walk shallowly through TLVs inside TBSCertificate and look for SubjectPublicKeyInfo.
    let off = tbs.valueOffset;
    while (off < tbs.endOffset) {
        const tlv = readTlv(bytes, off);
        if (isSequence(tlv)) {
            const first = readTlv(bytes, tlv.valueOffset);
            const secondOffset = first.endOffset;
            if (first.endOffset <= tlv.endOffset && secondOffset < tlv.endOffset) {
                const second = readTlv(bytes, secondOffset);
                // SubjectPublicKeyInfo ::= SEQUENCE { algorithm SEQUENCE, subjectPublicKey BIT STRING }
                if (isSequence(first) && second.tag === 0x03) {
                    const maybeOid = readTlv(bytes, first.valueOffset);
                    if (maybeOid.tag !== 0x06) {
                        off = tlv.endOffset;
                        continue;
                    }
                    const oidValue = bytes.slice(maybeOid.valueOffset, maybeOid.endOffset);
                    if (!equalsBytes(oidValue, RSA_ENCRYPTION_OID_BYTES)) {
                        off = tlv.endOffset;
                        continue;
                    }
                    return tlv;
                }
            }
        }
        off = tlv.endOffset;
    }

    throw new Error('Could not locate SubjectPublicKeyInfo in certificate.');
};

const importRsaOaepPublicKeyFromCertificateBase64 = async (certBase64) => {
    const certBytes = base64ToBytes(certBase64);
    const spkiTlv = findSpkiSequence(certBytes);
    const spkiDer = certBytes.slice(spkiTlv.offset, spkiTlv.endOffset);

    return await globalThis.crypto.subtle.importKey(
        'spki',
        spkiDer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt'],
    );
};
