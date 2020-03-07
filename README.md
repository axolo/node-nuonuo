# node-nuonuo

[Nuonuo] open API for Node.js.

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
  userTax: 'user-tax-number', // dynamic if isv is true
  okCode: '0000',
  accessTokenCache: {
    store: 'memory', // config cache-manager if use Redis
    prefix: 'nuonuo',
    ttl: 86400, // 24 hours
    quota: [ 50, 2592000 ], // 50 times / 30 days
  },
};
```

## API

### construct(config)

| params |  type  | description |
| ------ | ------ | ----------- |
| config | object | API config  |

> return

Nuonuo instance

### exec(method, content, userTax)

| params  |  type  |                       description                        |
| ------- | ------ | -------------------------------------------------------- |
| method  | string | [Nuonuo] method name                                       |
| content | object | [Nuonuo] private params, JSON.stringify automatic           |
| userTax | string | [Nuonuo] userTax, required to ISV and optional to Merchant |

> return

Nuonuo open API response

## TODO

throw Exception

[Nuonuo]: https://open.nuonuo.com/
