const assert = require('assert');
const {SingleSignOn} = require('../../electron/dist/js/lib/SingleSignOn');

describe('SingleSignOn"', () => {
  describe('protocol', () => {
    describe('generateSecret', () => {
      it('generates a secret of a specified size', async () => {
        const size = 24;
        const loginAuthorizationSecret = await SingleSignOn.protocol.generateSecret(size);
        assert.equal(loginAuthorizationSecret.length, size * 2);
      });
    });
  });
});
