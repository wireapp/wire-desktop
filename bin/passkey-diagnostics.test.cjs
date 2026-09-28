const assert = require('node:assert/strict');
const {test} = require('node:test');
const {validate, plist} = require('./passkey-diagnostics.cjs');

const now = new Date('2026-09-25T00:00:00Z');
function fixture() {
  return {
    bundleId: 'com.example.app',
    group: 'TEAM.com.example.app.webauthn',
    entitlements: {'keychain-access-groups': ['TEAM.com.example.app.webauthn']},
    profile: {
      TeamIdentifier: ['TEAM'],
      ApplicationIdentifierPrefix: ['TEAM'],
      ExpirationDate: '2027-09-25T00:00:00Z',
      Entitlements: {
        'com.apple.application-identifier': 'TEAM.com.example.app',
        'keychain-access-groups': ['TEAM.com.example.app.webauthn'],
      },
    },
  };
}

test('accepts matching signing prerequisites', () => {
  assert.doesNotThrow(() => validate(fixture(), now));
});

test('reads a real plist containing expiry dates and certificate data', {skip: process.platform !== 'darwin'}, () => {
  const source = fixture().profile;
  source.ExpirationDate = new Date(source.ExpirationDate);
  source.DeveloperCertificates = [Buffer.from('fixture certificate')];
  const decoded = plist(require('plist').build(source));
  assert.strictEqual(decoded.ExpirationDate.toISOString(), '2027-09-25T00:00:00.000Z');
  assert.deepStrictEqual(decoded.TeamIdentifier, ['TEAM']);
  validate({...fixture(), profile: decoded}, now);
});

test('accepts provisioning wildcard authorization', () => {
  const data = fixture();
  data.profile.Entitlements['keychain-access-groups'] = ['TEAM.*'];
  data.profile.Entitlements['com.apple.application-identifier'] = 'TEAM.com.example.*';
  assert.doesNotThrow(() => validate(data, now));
});

test('rejects a runtime group absent from the signed entitlement', () => {
  const data = fixture();
  data.entitlements['keychain-access-groups'] = [];
  assert.throws(() => validate(data, now), /Signed app entitlement/);
});

test('rejects a group not authorized by the profile', () => {
  const data = fixture();
  data.profile.Entitlements['keychain-access-groups'] = ['TEAM.other.*'];
  assert.throws(() => validate(data, now), /authorize the keychain/);
});

test('rejects a profile for another bundle', () => {
  const data = fixture();
  data.bundleId = 'com.example.other';
  assert.throws(() => validate(data, now), /bundle identifier/);
});

test('rejects expired profiles', () => {
  const data = fixture();
  data.profile.ExpirationDate = '2026-09-24T00:00:00Z';
  assert.throws(() => validate(data, now), /expired/);
});

test('rejects a profile from another team', () => {
  const data = fixture();
  data.profile.TeamIdentifier = ['OTHER'];
  assert.throws(() => validate(data, now), /Profile team/);
});

// Use public certificate data only; no signing identity or private key is needed.
const {X509Certificate} = require('node:crypto');
const {validateSigningCertificate} = require('./passkey-diagnostics.cjs');
const certificate = new X509Certificate(require('node:tls').rootCertificates[0]);
const certificateProfile = {DeveloperCertificates: [certificate.raw]};
const validDate = new Date((Date.parse(certificate.validFrom) + Date.parse(certificate.validTo)) / 2);

test('accepts the signing certificate authorized by the profile', () => {
  assert.doesNotThrow(() => validateSigningCertificate(certificateProfile, certificate.raw, validDate));
});

test('rejects a signing certificate absent from the profile', () => {
  assert.throws(() => validateSigningCertificate({DeveloperCertificates: []}, certificate.raw, validDate), /included/);
});

test('rejects expired or not yet valid signing certificates', () => {
  for (const date of [new Date(Date.parse(certificate.validFrom) - 1), new Date(certificate.validTo)]) {
    assert.throws(() => validateSigningCertificate(certificateProfile, certificate.raw, date), /validity period/);
  }
});
