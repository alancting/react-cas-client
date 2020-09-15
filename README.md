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

```javascript
import CasClient, { constant } from "react-cas-client";

let casEndpoint;
let casOptions = {};

new CasClient(casEndpoint, casOptions)
  .then(successRes => {
    console.log(successRes);
    // Login user in state / locationStorage ()
    // eg. loginUser(response.user);

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
```

### CAS Endpoint:

Endpoint of CAS Server (eg. `'xxxx.casserver.com'`)

### CAS Options

- `path` - CAS server service path (eg. `'/cas-tmp'`) (default: `'/cas'`)
- `protocol` - CAS server protocol, can be `'http'`, `'https'`) (default: `'https'`);
- `version` - CAS protocol version can be `constant.CAS_VERSION_2_0`, `constant.CAS_VERSION_3_0` (default: `constant.CAS_VERSION_3_0`)
- `validation_proxy_path` - Proxy path for application to make call to CAS server to validate ticket (**!! Related to CORS issue !!**)

### Possible Error Types

- `constant.CAS_ERROR_FETCH` - Error when validating ticket with CAS Server:
- `constant.CAS_ERROR_PARSE_RESPONSE` - Cannot parse response from CAS server
- `constant.CAS_ERROR_AUTH_ERROR` - User is not authorized

## CORS Issue

### Option 1

Update CAS server to set `Access-Control-Allow-Origin` for you application

### Option 2

Using reverse proxy in your application, we will use ngnix as example.

1. Update nginx conf to pass request from `*/cas_proxy` to your cas server - `https://xxxx.casserver.com/`

```
# nginx.conf

location /cas_proxy {
  proxy_pass http://xxxx.casserver.com/;
}
```

2. Apply CAS options - `validation_proxy_path` to '`/cas_proxy'`

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
