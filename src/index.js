'use strict';

const crypto = require('crypto');
const cacheManager = require('cache-manager');
const urllib = require('urllib');
const uuid = require('uuid');

class Nuonuo {
  /**
   * **诺诺Open API构造函数**
   *
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
   * **获取32位随机码**
   *
   * @returns {string}  32位随机码
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
    const sign = encodeURIComponent(crypto.createHmac('sha1', appSecret).update(signStr).digest('base64'));
    return sign;
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
    const { authUrl, accessTokenCache } = config;
    const cacheKey = [accessTokenCache.prefix, appKey].join('');
    const cache = await this.getCache(cacheKey);
    if (cache) return cache;
    const { data: token } = await curl(authUrl, {
      method: 'POST',
      dataType: 'json',
      data: {
        client_id: appKey,
        client_secret: appSecret,
        grant_type: grantType,
      },
    });
    if (!token.error) await this.setCache(cacheKey, token, accessTokenCache);
    return token;
  }

  /**
   * **服务商授权码方式获取令牌**
   *
   * @see https://open.nuonuo.com/#/dev-doc/auth-service
   * @param {string} appKey         应用ID
   * @param {string} appSecret      应用密钥
   * @param {string} code           授权码
   * @param {string} taxnum         用户税号
   * @param {string} redirectUri    重定向地址
   * @param {string} [grantType='authorization_code'] 授权方式
   * @return {object} 令牌
   * @memberof Nuonuo
   */
  async getIsvToken(appKey, appSecret, code, taxnum, redirectUri, grantType = 'authorization_code') {
    console.log(appKey, appSecret, code, taxnum, redirectUri, grantType);
    return 'getIsvToken';
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
    console.log(refreshToken, appKey, appSecret, grantType);
    return 'getIsvToken';
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
   * @param {string} content      私有请求参数
   * @return {object} 响应
   * @memberof Nuonuo
   */
  async sendRequest(requestUrl, senid, appKey, appSecret, accessToken, userTax, method, content) {
    const timestamp = Date.now(); // 时间戳
    const nonce = Math.floor(Math.random(1000000000)); // 随机正整数
    const sign = this.getSign(appSecret, appKey, senid, nonce, content, timestamp); // 签名
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
      data: content, // NOTE: Will be stringify automatically.
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
   * @return {object}           响应输出
   * @memberof Nuonuo
   */
  async exec(method, content) {
    const { apiUrl, appKey, appSecret, userTax, isv } = this.config;
    const senid = this.senid();
    const accessToken = isv ? await this.getIsvToken() : await this.getMerchantToken();
    const result = await this.sendRequest(apiUrl, senid, appKey, appSecret, accessToken, userTax, method, content);
    return result;
  }
}

module.exports =Nuonuo;
