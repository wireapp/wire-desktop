import {URL} from 'url';
import {ProxySetting} from 'get-proxy-settings';

function generateProxyURL(systemProxySettings: ProxySetting, authInfo: Electron.AuthInfo): URL {
  const {
    credentials: {username, password},
    protocol,
  } = systemProxySettings;

  const proxySettings = new URL(`${protocol}://${authInfo.host}`);
  if (username) {
    proxySettings.username = username;
  }
  if (password) {
    proxySettings.password = password;
  }
  if (authInfo.port) {
    proxySettings.port = authInfo.port.toString();
  }

  return proxySettings;
}

const ProxyAuth = {
  generateProxyURL,
};

export default ProxyAuth;
