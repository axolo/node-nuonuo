'use strict';

const crypto = require('crypto');
const cacheManager = require('cache-manager');
const urllib = require('urllib');
const uuid = require('uuid');

class Nuonuo {
  /**
   * **诺诺Open API构造函数**
   *
   * @todo throw Exception
   * @param {object} config 配置
   * @memberof Nuonuo
   */
  constructor(config) {
    const { curl = urllib.request, accessTokenCache } = config;
    this.config = config;
    this.curl = curl;
    this.cache = cacheManager.caching(accessTokenCache);
  }

  /**
   * **获取缓存**
   *
   * @param {string} key  键
   * @return {Promise}    缓存
   * @memberof Nuonuo
   */
  getCache(key) {
    const { cache } = this;
    return new Promise((resolve, reject) => {
      cache.get(key, (err, res) => {
        if (err) return reject(err);
        return resolve(res);
      });
    });
  }

  /**
   * **设置缓存**
   *
   * @param {string} key      键
   * @param {Any} val         值
   * @param {object} options  选项
   * @return {Promise}        缓存
   * @memberof Nuonuo
   */
  setCache(key, val, options) {
    const { cache } = this;
    return new Promise((resolve, reject) => {
      cache.set(key, val, options, err => {
        if (err) return reject(err);
        cache.get(key, (err, res) => {
          if (err) return reject(err);
          return resolve(res);
        });
      });
    });
  }

  /**
   * **商家获取令牌**
   *
   * @see https://open.nuonuo.com/#/dev-doc/auth-business
   * @param {string} appKey     应用ID
   * @param {string} appSecret  应用密钥
   * @param {string} [grantType='client_credentials'] 授权方式
   * @return {object} 令牌
   * @memberof Nuonuo
   */
  async getMerchantToken(appKey, appSecret, grantType = 'client_credentials') {
    const { config, curl } = this;
    const { authTokenUrl, accessTokenCache, userTax } = config;
    const cacheKey = [ accessTokenCache.prefix, appKey, userTax ].join('-');
    const cache = await this.getCache(cacheKey);
    if (cache) return cache;
    const data = {
      client_id: appKey,
      client_secret: appSecret,
      grant_type: grantType,
    };
    const { data: token } = await curl(authTokenUrl, { method: 'POST', data, dataType: 'json' });
    if (!token || token.error) return token;
    await this.setCache(cacheKey, token, accessTokenCache);
    return token;
  }

  /**
   * **服务商授权码方式获取令牌**
   *
   * ```js
   * {
   *  // 请求将自动被转换：
   *  headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
   *  data: querystring.stringify(data),
   * }
   * ```
   *
   * @see https://open.nuonuo.com/#/dev-doc/auth-service
   * @param {string} appKey         应用ID
   * @param {string} appSecret      应用密钥
   * @param {string} code           授权码
   * @param {string} userTax        用户税号
   * @param {string} redirectUri    重定向地址
   * @param {string} [grantType='authorization_code'] 授权方式
   * @return {object} 令牌
   * @memberof Nuonuo
   */
  async getIsvToken(appKey, appSecret, code, userTax, redirectUri, grantType = 'authorization_code') {
    const { config, curl } = this;
    const { authTokenUrl, accessTokenCache } = config;
    const cacheKey = [ accessTokenCache.prefix, appKey, userTax ].join('-');
    const cache = await this.getCache(cacheKey);
    if (cache) return cache;
    const data = {
      client_id: appKey,
      client_secret: appSecret,
      code,
      redirectUri,
      grant_type: grantType,
      taxNum: userTax,
    };
    const { data: token } = await curl(authTokenUrl, { method: 'POST', data, dataType: 'json' });
    if (!token || token.error) return token;
    await this.setCache(cacheKey, token, accessTokenCache);
    return token;
  }

  /**
   * **服务商刷新令牌方式获取令牌**
   *
   * @see https://open.nuonuo.com/#/dev-doc/auth-service
   * @param {string} refreshToken 刷新令牌
   * @param {string} appKey       应用ID
   * @param {string} appSecret    应用密钥
   * @param {string} [grantType='refresh_token'] 授权方式
   * @return {object} 令牌
   * @memberof Nuonuo
   */
  async refreshISVToken(refreshToken, appKey, appSecret, grantType = 'refresh_token') {
    const { config, curl } = this;
    const { authTokenUrl, accessTokenCache } = config;
    const data = {
      client_id: appKey,
      client_secret: appSecret,
      refresh_token: refreshToken,
      grant_type: grantType,
    };
    const { data: token } = await curl(authTokenUrl, { method: 'POST', data, dataType: 'json' });
    if (!token || token.error) return token;
    const { oauthUser: { userName: userTax } } = token;
    const cacheKey = [ accessTokenCache.prefix, appKey, userTax ].join('-');
    await this.setCache(cacheKey, token, accessTokenCache);
    return token;
  }

  /**
   * **服务商OAuth2授权码重定向**
   *
   * 诺诺商家应用回调URL应通过路由指向此方法，
   * 以`Egg.js`为例，路由表中增加一条：
   *
   * ```js
   * router.get('/nuonuo/redirect', ctx => app.nuonuo.isvAuthRedirect(ctx));
   * ```
   *
   * @see https://open.jss.com.cn/#/dev-doc/auth-service
   * @param {object} ctx context，request、response以及其他
   * @memberof Nuonuo
   */
  async isvAuthRedirect(ctx) {
    const { config } = this;
    const { query } = ctx.request;
    const { code, taxNum } = query;
    const { appKey, appSecret, redirectUri } = config;
    const token = await this.getIsvToken(appKey, appSecret, code, taxNum, redirectUri);
    ctx.body = (!token || token.error) ? token : 'success';
  }

  /**
   * **获取32位随机码**
   *
   * @return {string}  32位随机码
   * @memberof Nuonuo
   */
  senid() {
    return uuid.v4().replace(/-/gi, '');
  }

  /**
   * **计算签名**
   *
   * @param {string}  path      路径
   * @param {string}  appSecret 应用密钥
   * @param {string}  appKey    应用ID
   * @param {string}  senid     唯一标识，由企业自己生成32位随机码
   * @param {number}  nonce     8位随机正整数
   * @param {object}  body      请求包体
   * @param {number}  timestamp 时间戳
   * @return {string} 签名
   */
  getSign(path, appSecret, appKey, senid, nonce, body, timestamp) {
    const pieces = path.split('/');
    const signStr = `a=${pieces[3]}&l=${pieces[2]}&p=${pieces[1]}&k=${appKey}&i=${senid}&n=${nonce}&t=${timestamp}&f=${body}`;
    const hmac = crypto.createHmac('sha1', appSecret).update(signStr).digest('base64');
    const sign = hmac.toString();
    return sign;
  }

  /**
   * **发送请求**
   *
   * @param {string} requestUrl   请求地址
   * @param {string} senid        32位随机字符串
   * @param {string} appKey       应用ID
   * @param {string} appSecret    应用密钥
   * @param {string} accessToken  令牌
   * @param {string} userTax      用户税号
   * @param {string} method       API方法名
   * @param {object} content      私有请求参数
   * @return {object} 响应
   * @memberof Nuonuo
   */
  async sendRequest(requestUrl, senid, appKey, appSecret, accessToken, userTax, method, content) {
    const timestamp = Math.round(Date.now() / 1000); // 时间戳
    const nonce = Math.floor(Math.random(1000000000)); // 随机正整数
    const { pathname } = new URL(requestUrl);
    const jsonContent = JSON.stringify(content);
    const sign = this.getSign(pathname, appSecret, appKey, senid, nonce, jsonContent, timestamp); // 签名
    const url = `${requestUrl}?senid=${senid}&nonce=${nonce}&timestamp=${timestamp}&appkey=${appKey}`;
    const headers = {
      'Content-type': 'application/json',
      'X-Nuonuo-Sign': sign,
      accessToken,
      userTax,
      method,
    };
    const result = this.curl(url, {
      method: 'POST',
      headers,
      data: jsonContent,
      dataType: 'json',
    });
    return result;
  }

  /**
   * **调用接口**
   *
   * @see https://open.nuonuo.com/#/api-doc/common-api?id=100007
   * @param {string} method     API方法名
   * @param {string} content    私有请求参数
   * @param {string} userTax    用户税号
   * @return {object}           响应输出
   * @memberof Nuonuo
   */
  async exec(method, content, userTax) {
    const { apiUrl, appKey, appSecret, redirectUri, isv, okCode } = this.config;
    if (!userTax) userTax = this.config.userTax;
    const code = okCode;
    const { access_token: accessToken } = isv
      ? await this.getIsvToken(appKey, appSecret, code, userTax, redirectUri)
      : await this.getMerchantToken(appKey, appSecret);
    const senid = this.senid();
    const result = await this.sendRequest(apiUrl, senid, appKey, appSecret, accessToken, userTax, method, content);
    return result;
  }
}

module.exports = Nuonuo;
