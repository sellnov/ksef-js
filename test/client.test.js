import { test } from 'node:test';
import assert from 'node:assert';
import { KSeFClient } from '../src/index.js';

test('KSeFClient should initialize with default config', () => {
    const client = new KSeFClient();
    assert.strictEqual(typeof client.auth, 'object');
    assert.strictEqual(typeof client.sessions, 'object');
    assert.strictEqual(typeof client.invoices, 'object');
    assert.strictEqual(typeof client.certificates, 'object');
    assert.strictEqual(typeof client.permissions, 'object');
});

test('KSeFClient should allow setting token', () => {
    const client = new KSeFClient();
    client.setToken('test-token');
    assert.strictEqual(client.transport.defaults.headers.common['Authorization'], 'Bearer test-token');
});
