'use strict';

const Nuonuo = require('../src');

const config = {
  isv: false,
  redirectUri: 'http://localhost:7001/nuonuo/redirect', // if isv is true
  authTokenUrl: 'https://open.nuonuo.com/accessToken',
  authCodeUrl: 'https://open.nuonuo.com/authorize',
  apiUrl: 'https://sandbox.nuonuocs.cn/open/v1/services',
  appKey: 'sandbox',
  appSecret: 'sandbox',
  userTax: 'user-tax-number',
  okCode: '0000',
  accessTokenCache: {
    store: 'memory',
    prefix: 'nuonuo',
    ttl: 86400, // 24 hours
    quota: [ 50, 2592000 ], // 50 times / 30 days
  },
};

const nuonuo = new Nuonuo(config);

const senid = nuonuo.senid();
console.log({ senid });

// const { appKey, appSecret, accessTokenCache, userTax } = nuonuo.config;
// const cacheKey = [ accessTokenCache.prefix, appKey, userTax ].join('-');
// const cacheVal = { access_token: 'ACCESS_TOKEN', expires_in: 86400 };
// nuonuo.getCache(cacheKey).then(res => console.log({ getCache: res }));
// nuonuo.setCache(cacheKey, cacheVal, accessTokenCache).then(res => console.log({ setCache: res }));

// nuonuo.getMerchantToken(appKey, appSecret).then(res => console.log({ getMerchantToken: res }));
