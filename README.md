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

## config

```js
const config = {
  isv: false,
  redirectUri: 'http://localhost:7001/nuonuo/redirect', // required if isv is true
  authTokenUrl: 'https://open.nuonuo.com/accessToken',
  authCodeUrl: 'https://open.nuonuo.com/authorize',
  apiUrl: 'https://sandbox.nuonuocs.cn/open/v1/services',
  appKey: 'sandbox',
  appSecret: 'sandbox',
  userTax: 'user-tax-number',
  accessTokenCache: {
    store: 'memory',
    prefix: 'nuonuo',
    ttl: 86400, // 24 hours
    quota: [ 50, 2592000 ], // 50 times / 30 days
  },
};
```

## API

### construct(config)

#### params

- config: Nuonuo invoice config

#### return

Nuonuo instance

### exec(method, content, userTax)

#### params

- method: Nuonuo API method name
- content: Nuouo private params, JSON.stringify automatic
- userTax: Nuonuo userTax, required to ISV and optional to Merchant

[Nuonuo]: https://open.nuonuo.com/
