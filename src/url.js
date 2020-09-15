const buildUrl = require('build-url');

const constant = require('./constant');
const util = require('./util');

const getLoginUrl = (cas, gateway = false) => {
  let baseUrl = _getCasBaseUrl(cas);
  let queryParams = {
    service: buildUrl(cas.redirectUrl, {
      queryParams: { status: constant.CAS_STATUS_IN_PROCESS },
    }),
  };
  if (gateway) {
    queryParams.gateway = true;
  }
  switch (cas.version) {
    case constant.CAS_VERSION_2_0:
    case constant.CAS_VERSION_3_0:
      return buildUrl(baseUrl, {
        path: 'login',
        queryParams: queryParams,
      });
    default:
      throw util.throwError('Unsupported CAS Version');
  }
};

const getLogoutUrl = (cas, redirectPath = '') => {
  let baseUrl = _getCasBaseUrl(cas);
  let redirectUrl = buildUrl(window.location.origin, {
    path: redirectPath,
  });
  let queryParams = {};

  switch (cas.version) {
    case constant.CAS_VERSION_2_0:
      if (!util.isEmpty(redirectPath)) {
        queryParams = {
          url: redirectUrl,
        };
      }
      break;
    case constant.CAS_VERSION_3_0:
      if (!util.isEmpty(redirectPath)) {
        queryParams = {
          service: redirectUrl,
        };
      }
      break;
    default:
      throw util.throwError('Unsupported CAS Version');
  }

  let params = { path: 'logout' };
  if (Object.keys(queryParams).length !== 0) {
    params.queryParams = queryParams;
  }

  return buildUrl(baseUrl, params);
};

const getValidateUrl = (cas, ticket) => {
  let baseUrl = _getCasBaseUrl(cas, true);
  let queryParams = {
    service: cas.redirectUrl,
    ticket: ticket,
  };

  let path = '';
  switch (cas.version) {
    case constant.CAS_VERSION_2_0:
      path = 'serviceValidate';
      break;
    case constant.CAS_VERSION_3_0:
      path = 'p3/serviceValidate';
      queryParams.format = 'json';
      break;
    default:
      throw util.throwError('Unsupported CAS Version');
  }

  return buildUrl(baseUrl, {
    path: path,
    queryParams: queryParams,
  });
};

const _getCasBaseUrl = (cas, withProxyIfExists = false) => {
  if (withProxyIfExists && !util.isEmpty(cas.validation_proxy_path)) {
    return window.location.origin + cas.validation_proxy_path + cas.path;
  } else {
    return util.getFullProtocol(cas.protocol) + cas.endpoint + cas.path;
  }
};

export { getLoginUrl, getLogoutUrl, getValidateUrl };
