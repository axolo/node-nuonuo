'use strict';

const Nuonuo = require('../src');

const config = {
  authUrl: 'https://open.nuonuo.com/accessToken',
  apiUrl: 'https://sandbox.nuonuocs.cn/open/v1/services',
  appKey: 'sandbox',
  appSecret: 'sandbox',
  userTax: 'user-tax-number',
  isv: false,
  accessTokenCache: {
    store: 'memory',
    prefix: 'nuonuo_',
    ttl: 86400, // 24 hours
    quota: [ 50, 2592000 ], // 50 times / 30 days
  },
};

const nuonuo = new Nuonuo(config);
// const { appKey, accessTokenCache } = nuonuo.config;

// nuonuo.getMerchantToken(appKey, appSecret).then(res => console.log(res));

// const cacheKey = [ accessTokenCache.prefix, appKey ].join('');
// const cacheVal = { access_token: 'ACCESS_TOKEN', expires_in: 86400, created_at: Date.now() };
// nuonuo.getCache(cacheKey).then(res => console.log(res));
// nuonuo.setCache(cacheKey, cacheVal, accessTokenCache).then(res => console.log(res));

const senid = nuonuo.senid();
console.log({ senid });
