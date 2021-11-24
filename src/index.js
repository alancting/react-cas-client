const fetch = require('node-fetch');
const xml2js = require('xml2js');
const util = require('./util');
const urls = require('./url');
const constant = require('./constant');

const defaultOptions = {
  protocol: 'https',
  path: '/cas',
  version: constant.CAS_VERSION_3_0,
  proxy_callback_url: '',
  validation_proxy: false,
  validation_proxy_protocol: '',
  validation_proxy_endpoint: '',
  validation_proxy_path: '',
};

class CasClient {
  constructor(endpoint, options = {}) {
    if (util.isEmpty(endpoint)) {
      util.throwError('Missing endpoint');
    }
    let version = options.version || defaultOptions.version;
    if (!constant.CAS_VERSIONS.includes(version)) {
      util.throwError('Unsupported CAS Version');
    }

    this.endpoint = endpoint;
    this.path = options.path || defaultOptions.path;
    this.protocol = options.protocol || defaultOptions.protocol;
    this.version = options.version || defaultOptions.version;
    this.proxy_callback_url =
      options.proxy_callback_url || defaultOptions.proxy_callback_url;
    this.validation_proxy =
      options.validation_proxy || defaultOptions.validation_proxy;
    this.validation_proxy_protocol =
      options.validation_proxy_protocol ||
      defaultOptions.validation_proxy_protocol;
    this.validation_proxy_endpoint =
      options.validation_proxy_endpoint ||
      defaultOptions.validation_proxy_endpoint;
    this.validation_proxy_path =
      options.validation_proxy_path || defaultOptions.validation_proxy_path;

    this.redirectUrl = util.getCurrentUrl();
  }

  auth(gateway = false) {
    return new Promise((resolve, reject) => {
      /**
       * Save ticket to sessionStorage if exists
       */
      const ticket = util.getParamFromCurrentUrl('ticket');
      if (util.isEmpty(ticket)) {
        let status = util.getParamFromCurrentUrl('status');
        if (status === constant.CAS_STATUS_IN_PROCESS) {
          this._handleFailsValdiate(reject, {
            type: constant.CAS_ERROR_AUTH_ERROR,
            message: 'Missing ticket from return url',
          });
        } else {
          window.location.href = urls.getLoginUrl(this, gateway);
        }
      } else {
        this._validateTicket(ticket, resolve, reject);
      }
    });
  }

  logout(redirectPath = '') {
    window.location.href = urls.getLogoutUrl(this, redirectPath);
  }

  _getSuccessResponse(user, pgtIou = null) {
    let response = {
      currentUrl: window.location.origin + window.location.pathname,
      currentPath: window.location.pathname,
      user: user,
    };
    if (pgtIou) {
      response.pgtIou = pgtIou;
    }
    return response;
  }

  _validateTicket(ticket, resolve, reject) {
    let version = this.version;
    let content_type;
    switch (version) {
      case constant.CAS_VERSION_2_0:
        content_type = 'text/xml';
        break;
      case constant.CAS_VERSION_3_0:
        content_type = 'application/json';
        break;
      default:
        throw util.throwError('Unsupported CAS Version');
    }

    fetch(urls.getValidateUrl(this, ticket), {
      headers: {
        'Content-Type': content_type,
      },
    })
      .then(
        function (response) {
          response
            .text()
            .then(
              function (text) {
                switch (version) {
                  case constant.CAS_VERSION_2_0:
                    xml2js
                      .parseStringPromise(text)
                      .then(
                        function (result) {
                          let response = result['cas:serviceResponse'];
                          if (response['cas:authenticationSuccess']) {
                            let successes =
                              response['cas:authenticationSuccess'];
                            if (successes.length) {
                              let user = successes[0]['cas:user'][0];

                              let pgtIou = null;
                              if (!util.isEmpty(this.proxy_callback_url)) {
                                pgtIou =
                                  successes[0]['cas:proxyGrantingTicket'][0];
                              }
                              this._handleSuccessValdiate(
                                resolve,
                                user,
                                pgtIou
                              );

                              this._handleSuccessValdiate(resolve, user);
                            }
                          } else {
                            let failures =
                              response['cas:authenticationFailure'];
                            if (failures.length) {
                              this._handleFailsValdiate(reject, {
                                type: constant.CAS_ERROR_AUTH_ERROR,
                                code: failures[0].$.code.trim(),
                                message: failures[0]._.trim(),
                              });
                            }
                          }
                        }.bind(this)
                      )
                      .catch(
                        function (error) {
                          this._handleFailsValdiate(reject, {
                            type: constant.CAS_ERROR_PARSE_RESPONSE,
                            message: 'Failed to parse response',
                            exception: error,
                          });
                        }.bind(this)
                      );
                    break;
                  case constant.CAS_VERSION_3_0:
                    try {
                      let json = JSON.parse(text);
                      if (json.serviceResponse) {
                        if (json.serviceResponse.authenticationSuccess) {
                          let user =
                            json.serviceResponse.authenticationSuccess.user;
                          let pgtIou = null;
                          if (!util.isEmpty(this.proxy_callback_url)) {
                            pgtIou =
                              json.serviceResponse.authenticationSuccess
                                .proxyGrantingTicket;
                          }
                          this._handleSuccessValdiate(resolve, user, pgtIou);
                        } else {
                          this._handleFailsValdiate(reject, {
                            type: constant.CAS_ERROR_AUTH_ERROR,
                            code: json.serviceResponse.authenticationFailure
                              .code,
                            message:
                              json.serviceResponse.authenticationFailure
                                .description,
                          });
                        }
                      }
                    } catch (error) {
                      this._handleFailsValdiate(reject, {
                        type: constant.CAS_ERROR_PARSE_RESPONSE,
                        message: 'Failed to parse response',
                        exception: error,
                      });
                    }
                    break;
                  default:
                    throw util.throwError('Unsupported CAS Version');
                }
                throw util.throwError('Stop...');
              }.bind(this)
            )
            .catch(
              function (error) {
                this._handleFailsValdiate(reject, {
                  type: constant.CAS_ERROR_PARSE_RESPONSE,
                  message: 'Failed to parse response',
                  exception: error,
                });
              }.bind(this)
            );
        }.bind(this)
      )
      .catch(
        function (error) {
          this._handleFailsValdiate(reject, {
            type: constant.CAS_ERROR_FETCH,
            message: 'Failed to connect CAS server',
            exception: error,
          });
        }.bind(this)
      );
  }

  _handleSuccessValdiate(callback, user, pgtIou = null) {
    callback(this._getSuccessResponse(user, pgtIou));
  }

  _handleFailsValdiate(callback, error) {
    error.currentUrl = window.location.origin + window.location.pathname;
    error.currentPath = window.location.pathname;
    callback(error);
  }
}

export default CasClient;
export { constant };
