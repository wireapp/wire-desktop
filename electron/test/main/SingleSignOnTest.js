const assert = require('assert');
const {SingleSignOn} = require('../../instrumented-code/lib/SingleSignOn');

describe('generateSecret', () => {
  it('generates a secret of a specified size', async () => {
    const size = 24;
    const loginAuthorizationSecret = await SingleSignOn.protocol.generateSecret(size);
    assert.strictEqual(loginAuthorizationSecret.length, size * 2);
  });
});
