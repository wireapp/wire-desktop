// TODO: Remove dependency on "querystring"
import * as querystring from 'querystring';

export class WindowUrl {
  static parseParams(url: string): querystring.ParsedUrlQuery {
    const urlObject = new URL(url);
    return urlObject.search ? querystring.parse(urlObject.search.substr(1)) : {};
  }

  static getQueryString(params: querystring.ParsedUrlQuery): string {
    return `?${querystring.unescape(querystring.stringify(params))}`;
  }

  static replaceQueryParams(url: string, params: querystring.ParsedUrlQuery): string {
    const fullHost = url.split('?')[0];
    const unescapedQueryParams = WindowUrl.getQueryString(params);
    return encodeURIComponent(`${fullHost}${unescapedQueryParams}`);
  }

  static createWebappUrl(
    localRendererUrl: string,
    customBackendUrl: string,
    withRendererPage: boolean = false,
  ): string {
    const localFileParams = WindowUrl.parseParams(localRendererUrl);
    const envUrlParams = WindowUrl.parseParams(localFileParams['env'] as string);
    const customBackendUrlParams = WindowUrl.parseParams(customBackendUrl);
    const mergedParams = {...envUrlParams, ...customBackendUrlParams};
    const newEnvUrl = WindowUrl.replaceQueryParams(customBackendUrl, mergedParams);

    if (withRendererPage === true) {
      const cutPattern = '?env=';
      const localFilePrefix = `${localRendererUrl.split(cutPattern)[0]}${cutPattern}`;
      return `${localFilePrefix}${newEnvUrl}`;
    }
    return newEnvUrl;
  }
}
