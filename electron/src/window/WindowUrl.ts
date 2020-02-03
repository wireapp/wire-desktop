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

  static createWebappUrl(localRendererUrl: string, customBackendUrl: string): string {
    const localFileParams = WindowUrl.parseParams(localRendererUrl);
    const envUrlParams = WindowUrl.parseParams(localFileParams['env'] as string);
    const customBackendUrlParams = WindowUrl.parseParams(customBackendUrl);
    const mergedParams = {...envUrlParams, ...customBackendUrlParams};

    const newEnvUrl = WindowUrl.replaceQueryParams(customBackendUrl, mergedParams);

    const cutPattern = '?env=';
    const localFilePrefix = localRendererUrl.substring(0, localRendererUrl.indexOf(cutPattern) + cutPattern.length);

    return `${localFilePrefix}${newEnvUrl}`;
  }
}
