import {URL} from 'url';
import {ProxySetting} from 'get-proxy-settings';

function generateProxyURL(systemProxySettings: ProxySetting, authInfo: Electron.AuthInfo): URL {
  const {
    credentials: {username, password},
    protocol,
  } = systemProxySettings;
  return new URL(`${protocol}//${username}:${password}@${authInfo.host}:${authInfo.port}`);
}

const ProxyAuth = {
  generateProxyURL,
};

export default ProxyAuth;
