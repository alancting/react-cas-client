[![NPM](https://img.shields.io/npm/v/react-cas-client?style=for-the-badge)](https://www.npmjs.com/package/react-cas-client)
[![GitHub](https://img.shields.io/github/package-json/v/alancting/react-cas-client?label=%20GitHub&style=for-the-badge)](https://github.com/alancting/react-cas-client)
[![Test](https://img.shields.io/github/workflow/status/alancting/react-cas-client/Node.js%20CI?label=TEST&style=for-the-badge)](https://github.com/alancting/react-cas-client)
[![Coverage Status](https://img.shields.io/coveralls/github/alancting/react-cas-client/master?style=for-the-badge)](https://coveralls.io/github/alancting/react-cas-client?branch=master)
[![GitHub license](https://img.shields.io/github/license/alancting/react-cas-client?color=blue&style=for-the-badge)](https://github.com/alancting/react-cas-client/blob/master/LICENSE)

# React CAS Client

`react-cas-client` is a simple CAS Client for ReactJS for Apereo CAS server (CAS 2.0 and 3.0 protocol)

## Installation

### Install with npm

```shell
npm install react-cas-client
```

### Install with yarn

```shell
yarn add react-cas-client
```

## Usage

Example: [alancting/react-cas-client-example](https://github.com/alancting/react-cas-client-example)

### Initialize CAS Client

```javascript
import CasClient, { constant } from "react-cas-client";

let casEndpoint = "xxxx.casserver.com";
let casOptions = { version: constant.CAS_VERSION_2_0 };

let casClient = new CasClient(casEndpoint, casOptions);
```

#### CAS Endpoint

Endpoint of CAS Server (eg. `'xxxx.casserver.com'`)

#### CAS Options

- `path` - CAS server service path (eg. `'/cas-tmp'`) (default: `'/cas'`)
- `protocol` - CAS server protocol, can be `'http'`, `'https'` (default: `'https'`);
- `version` - CAS protocol version can be `constant.CAS_VERSION_2_0`, `constant.CAS_VERSION_3_0` (default: `constant.CAS_VERSION_3_0`)
- `proxy_callback_url` - URL of the proxy callback ([pgtUrl](https://apereo.github.io/cas/4.2.x/protocol/CAS-Protocol-Specification.html#251-parameters))
- `validation_proxy` - Enable validation proxy (boolean) (default: `false`)
- Only Apply When `validation_proxy` = `true`
  - `validation_proxy_protocol` - Validation proxy server protocol (`'http'`/`'https'`) (default: **current url protocol**)
  - `validation_proxy_endpoint` - Validation proxy server endpoint (default: **current endpoint**)
  - `validation_proxy_path` - Proxy path for application to make call to CAS server to validate ticket  (default: '')

### Start authorization flow (Login)

```javascript
// Basic usage
casClient
  .auth()
  .then(successRes => {
    console.log(successRes);
    // Login user in state / locationStorage ()
    // eg. loginUser(response.user);

    // If proxy_callback_url is set, handle pgtpgtIou with Proxy Application

    // Update current path to trim any extra params in url
    // eg. this.props.history.replace(response.currentPath);
  })
  .catch(errorRes => {
    console.error(errorRes);
    // Error handling
    // displayErrorByType(errorRes.type)

    // Update current path to trim any extra params in url
    // eg. this.props.history.replace(response.currentPath);
  });

// Login with gateway
let gateway = true;

casClient
  .auth(gateway)
  .then(successRes => {})
  .catch(errorRes => {});
```

#### Gateway

Apply gateway param to CAS login url when `gateway` is given ([Documentation](https://apereo.github.io/cas/6.0.x/protocol/CAS-Protocol-V2-Specification.html#211-parameters))

- Boolean: `true` / `false` (default: `false`)

#### Possible Error Types

- `constant.CAS_ERROR_FETCH` - Error when validating ticket with CAS Server:
- `constant.CAS_ERROR_PARSE_RESPONSE` - Cannot parse response from CAS server
- `constant.CAS_ERROR_AUTH_ERROR` - User is not authorized

### Logout CAS

```javascript
// Assume current url is https://localhost.com/

// Basic usage
casClient.logout();

// Apply redirect url to CAS logout url
// You can applied redirectPath.
// In this case, https://localhost.com/logout will be applied to logout url
let redirectPath = "/logout";
casClient.logout(redirectPath);
```

#### Redirect Path

Apply redirect url to CAS logout url when `refirectPath` is given ([Documentation](https://apereo.github.io/cas/6.0.x/protocol/CAS-Protocol-V2-Specification.html#211-parameters))

- String: any path (default: `/`)

## CORS Issue

### Option 1

Update CAS server to set `Access-Control-Allow-Origin` for you application

### Option 2

Using reverse proxy in your application, we will use ngnix as example.

1. Update nginx conf to pass request from `*/cas_proxy` to your cas server - `https://xxxx.casserver.com/cas`

```
# nginx.conf

location /cas_proxy {
  proxy_pass http://xxxx.casserver.com/cas/;
}
```

2. Apply CAS options - `validation_proxy_path` to `'/cas_proxy'`

## Test

### Test with npm

```shell
npm run test
```

### Test with yarn

```shell
yarn run test
```

## License

MIT license
