const fetch = require('node-fetch');
const xml2js = require('xml2js');
const util = require('./util');
const urls = require('./url');
const constant = require('./constant');

const defaultOptions = {
  protocol: 'https',
  path: '/cas',
  version: constant.CAS_VERSION_3_0,
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
    this.validation_proxy_path =
      options.validation_proxy_path || defaultOptions.validation_proxy_path;

    this.redirectUrl = util.getCurrentUrl();
  }

  auth(gateway = false) {
    return new Promise((resolve, reject) => {
      /**
       * Save ticket to sessionStorage if exists
       */
      let ticket = util.getParamFromCurrentUrl('ticket');
      if (util.isEmpty(ticket)) {
        let status = util.getParamFromCurrentUrl('status');
        if (status === constant.CAS_STATUS_IN_PROCESS) {
          this._handleFailsValidate(reject, {
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

  _getSuccessResponse(user, attributes) {
    return {
      currentUrl: window.location.origin + window.location.pathname,
      currentPath: window.location.pathname,
      user: user,
      attributes: attributes,
    };
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
        function(response) {
          response
            .text()
            .then(
              function(text) {
                switch (version) {
                  case constant.CAS_VERSION_2_0:
                    xml2js
                      .parseStringPromise(text)
                      .then(
                        function(result) {
                          let response = result['cas:serviceResponse'];
                          if (response['cas:authenticationSuccess']) {
                            let successes =
                              response['cas:authenticationSuccess'];
                            if (successes.length) {
                              let user = successes[0]['cas:user'][0];
                              this._handleSuccessValidate(resolve, user, null);
                            }
                          } else {
                            let failures =
                              response['cas:authenticationFailure'];
                            if (failures.length) {
                              this._handleFailsValidate(reject, {
                                type: constant.CAS_ERROR_AUTH_ERROR,
                                code: failures[0].$.code.trim(),
                                message: failures[0]._.trim(),
                              });
                            }
                          }
                        }.bind(this),
                      )
                      .catch(
                        function(error) {
                          this._handleFailsValidate(reject, {
                            type: constant.CAS_ERROR_PARSE_RESPONSE,
                            message: 'Failed to parse response',
                            exception: error,
                          });
                        }.bind(this),
                      );
                    break;
                  case constant.CAS_VERSION_3_0:
                    try {
                      let json = JSON.parse(text);
                      if (json.serviceResponse) {
                        if (json.serviceResponse.authenticationSuccess) {
                          let user =
                            json.serviceResponse.authenticationSuccess.user;
                          let attributes = null;
                          if (json.serviceResponse.authenticationSuccess.attributes) {
                            attributes = json.serviceResponse.authenticationSuccess.attributes;
                          }
                          this._handleSuccessValidate(resolve, user, attributes);
                        } else {
                          this._handleFailsValidate(reject, {
                            type: constant.CAS_ERROR_AUTH_ERROR,
                            code:
                            json.serviceResponse.authenticationFailure.code,
                            message:
                            json.serviceResponse.authenticationFailure
                              .description,
                          });
                        }
                      }
                    } catch (error) {
                      this._handleFailsValidate(reject, {
                        type: constant.CAS_ERROR_PARSE_RESPONSE,
                        message: 'Failed to parse response',
                        exception: error,
                      });
                    }
                    break;
                  default:
                    throw util.throwError('Unsupported CAS Version');
                }
              }.bind(this),
            )
            .catch(
              function(error) {
                this._handleFailsValidate(reject, {
                  type: constant.CAS_ERROR_PARSE_RESPONSE,
                  message: 'Failed to parse response',
                  exception: error,
                });
              }.bind(this),
            );
        }.bind(this),
      )
      .catch(
        function(error) {
          this._handleFailsValidate(reject, {
            type: constant.CAS_ERROR_FETCH,
            message: 'Failed to connect CAS server',
            exception: error,
          });
        }.bind(this),
      );
  }

  _handleSuccessValidate(callback, user, attributes) {
    callback(this._getSuccessResponse(user, attributes));
  }

  _handleFailsValidate(callback, error) {
    error.currentUrl = window.location.origin + window.location.pathname;
    error.currentPath = window.location.pathname;
    callback(error);
  }
}

export default CasClient;
export { constant };
