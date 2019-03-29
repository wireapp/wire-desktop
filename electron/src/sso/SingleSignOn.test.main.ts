import * as assert from 'assert';
import {SingleSignOn} from './SingleSignOn';

describe('generateSecret', () => {
  it('generates a secret of a specified size', async () => {
    const size = 24;
    const loginAuthorizationSecret = await SingleSignOn['protocol'].generateSecret(size);
    assert.strictEqual(loginAuthorizationSecret.length, size * 2);
  });
});
