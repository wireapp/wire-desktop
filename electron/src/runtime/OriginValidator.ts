import * as url from 'url';

class OriginValidator {
  static isMatchingHost(urlString: string, baseUrl: string): boolean {
    return url.parse(urlString).host === url.parse(baseUrl).host;
  }
}

export {OriginValidator};
