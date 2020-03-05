# node-nuonuo

[Nuonuo] open api for Node.js.

## install

```bash
npm install @axolo/node-nuonuo --save
```

## test

```bash
npm run test
```

> use by program see in [test](./test/index.js)

## config

```js
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
```

## API

TODO


[Nuonuo]: https://open.nuonuo.com/
