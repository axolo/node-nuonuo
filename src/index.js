'use strict';

const crypto = require('crypto');
const nanoid = require('nanoid');
const cacheManager = require('cache-manager');
const urllib = require('urllib');

class Nuonuo {
  constructor(config) {
    const { curl = urllib.request, accessTokenCache } = config;
    this.config = config;
    this.curl = curl;
    this.cache = cacheManager.caching(accessTokenCache);
  }

  /**
   * **获取缓存**
   *
   * @param {String} key 键
   * @return {Promise} 缓存
   * @memberof DingtalkIsv
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
   * @param {String} key 键
   * @param {Any} val 值
   * @param {Object} options 选项
   * @return {Promise} 缓存
   * @memberof DingtalkIsv
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

  senid() {
    return crypto.createHash('md5').update(nanoid()).digest('hex');
  }

  /**
   * **计算签名**
   *
   * @param {String}  path      请求地址
   * @param {String}  appSecret appSecret
   * @param {String}  appKey    appKey
   * @param {String}  senid     唯一标识，由企业自己生成32位随机码
   * @param {Number}  nonce     8位随机正整数
   * @param {Object}  body      请求包体
   * @param {Number}  timestamp 时间戳
   * @return {String} 签名
   */
  getSign(path, appSecret, appKey, senid, nonce, body, timestamp) {
    const pieces = path.split('/');
    const signStr = `a=${pieces[3]}&l=${pieces[2]}&p=${pieces[1]}&k=${appKey}&i=${senid}&n=${nonce}&t=${timestamp}&f=${body}`;
    const sign = encodeURIComponent(crypto.createHmac('sha1', appSecret).update(signStr).digest('base64'));
    return sign;
  }

  async getMerchantToken(appKey, appSecret, grantType = 'client_credentials') {
    const { config, curl, getCache } = this;
    const { authUrl, accessTokenCache } = config;
    const cacheKey = [accessTokenCache.prefix, appKey].join('');
    const cache = await getCache(cacheKey);
    console.log(cache);
    if (cache) return cache.accessToken;
    const { data: token } = await curl(authUrl, {
      method: 'POST',
      dataType: 'json',
      data: {
        client_id: appKey,
        client_secret: appSecret,
        grant_type: grantType,
      },
    });
    return token;
  }

  getIsvToken(appKey, appSecret, code, taxnum, redirectUri) {
    console.log(appKey, appSecret, code, taxnum, redirectUri);
    return 'getIsvToken';
  }

  refreshISVToken(refreshToken, userId, appSecret) {
    console.log(refreshToken, userId, appSecret);
    return 'getIsvToken';
  }

  sendRequest(requestUrl, senid, appKey, appSecret, accessToken, userTax, method, content) {
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

  async exec(method, content) {
    const { apiUrl, appKey, appSecret, userTax } = this.config;
    const senid = this.senid();
    const accessToken = await this.getToken();
    const result = await this.sendRequest(apiUrl, senid, appKey, appSecret, accessToken, userTax, method, content);
    return result;
  }

}

module.exports =Nuonuo;
