const constant = require('../src/constant');
const url = require('../src/url');
const CasClient = require('../src/index').default;

beforeEach(() => {
  window.history.pushState(null, null, '/');
});

afterEach(() => {
  window.history.replaceState(null, null, '/');
});

describe('getLoginUrl()', () => {
  describe.each([[constant.CAS_VERSION_2_0], [constant.CAS_VERSION_3_0]])(
    'cas version: %p',
    (casVersion) => {
      describe.each([['http'], ['https']])(
        'cas protocol: %p',
        (casProtocol) => {
          describe.each([[true], [false]])(
            'validate proxy path set: %p',
            (proxyPathSet) => {
              describe.each([
                [
                  'index',
                  () => {},
                  'https://mock.testing.com/?status=in_process',
                ],
                [
                  'dashboard',
                  () => {
                    window.history.pushState(null, null, '/dashboard');
                  },
                  'https://mock.testing.com/dashboard?status=in_process',
                ],
              ])(
                'current page is %p',
                (pageName, changePageAction, expectedReturnUrl) => {
                  beforeEach(() => {
                    changePageAction();
                  });

                  afterEach(() => {
                    window.history.replaceState(null, null, '/');
                  });

                  test.each([
                    [
                      undefined,
                      casProtocol +
                        '://fake.cas.com/cas-path/login?service=' +
                        encodeURIComponent(expectedReturnUrl),
                    ],
                    [
                      true,
                      casProtocol +
                        '://fake.cas.com/cas-path/login?service=' +
                        encodeURIComponent(expectedReturnUrl) +
                        '&gateway=true',
                    ],
                    [
                      false,
                      casProtocol +
                        '://fake.cas.com/cas-path/login?service=' +
                        encodeURIComponent(expectedReturnUrl),
                    ],
                  ])('gatway: %p', (gateway, expectedCasLoginUrl) => {
                    let casParams = {
                      path: '/cas-path',
                      version: casVersion,
                      protocol: casProtocol,
                    };
                    if (proxyPathSet) {
                      casParams.validation_proxy_path = '/mock_proxy_path';
                    }

                    let cas = new CasClient('fake.cas.com', casParams);
                    if (gateway !== undefined) {
                      expect(url.getLoginUrl(cas, gateway)).toBe(
                        expectedCasLoginUrl
                      );
                    } else {
                      expect(url.getLoginUrl(cas)).toBe(expectedCasLoginUrl);
                    }
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

describe('getLogoutUrl()', () => {
  describe.each([
    [constant.CAS_VERSION_2_0, 'url'],
    [constant.CAS_VERSION_3_0, 'service'],
  ])('cas version: %p', (casVersion, logoutUrlParam) => {
    describe.each([['http'], ['https']])('cas protocol: %p', (casProtocol) => {
      describe.each([[true], [false]])(
        'validate proxy path set: %p',
        (proxyPathSet) => {
          describe.each([
            ['index', () => {}, 'https://mock.testing.com/'],
            [
              'dashboard',
              () => {
                window.history.pushState(null, null, '/dashboard');
              },
              'https://mock.testing.com/',
            ],
          ])(
            'current page is %p',
            (pageName, changePageAction, expectedReturnUrl) => {
              let cas;

              beforeEach(() => {
                changePageAction();

                let casParams = {
                  path: '/cas-path',
                  version: casVersion,
                  protocol: casProtocol,
                };
                if (proxyPathSet) {
                  casParams.validation_proxy_path = '/mock_proxy_path';
                }

                cas = new CasClient('fake.cas.com', casParams);
              });

              afterEach(() => {
                window.history.replaceState(null, null, '/');
              });

              test('path is not given', () => {
                expect(url.getLogoutUrl(cas)).toBe(
                  casProtocol + '://fake.cas.com/cas-path/logout'
                );
              });
              test('path is given', () => {
                expect(url.getLogoutUrl(cas, '/logout')).toBe(
                  casProtocol +
                    '://fake.cas.com' +
                    '/cas-path' +
                    '/logout?' +
                    logoutUrlParam +
                    '=' +
                    encodeURIComponent(expectedReturnUrl + 'logout')
                );
              });
            }
          );
        }
      );
    });
  });
});

describe('getValidateUrl()', () => {
  describe.each([
    [constant.CAS_VERSION_2_0, '/serviceValidate', ''],
    [constant.CAS_VERSION_3_0, '/p3/serviceValidate', '&format=json'],
  ])('cas version: %p', (casVersion, casServicePath, casExtraParamStr) => {
    describe.each([['http'], ['https']])('cas protocol: %p', (casProtocol) => {
      describe.each([[], ['http://mock.proxy.com/callback']])(
        'cas proxy callback url: %p',
        (proxyCallbackUrl) => {
          describe.each([[], [true], [false]])(
            'validation proxy: %p',
            (validationProxy) => {
              describe.each([[''], ['http'], ['https']])(
                'validation proxy protocal: %p',
                (validationProxyProtocol) => {
                  describe.each([[''], ['validation.proxy.com']])(
                    'validation proxy endpoint: %p',
                    (validationProxyEndpoint) => {
                      describe.each([[''], ['/validation_proxy_path']])(
                        'validation proxy path: %p',
                        (validationProxyPath) => {
                          describe.each([
                            ['index', () => {}, 'https://mock.testing.com/'],
                            [
                              'index with extra params',
                              () => {
                                window.history.pushState(
                                  null,
                                  null,
                                  '/?other_params=1234'
                                );
                              },
                              'https://mock.testing.com/?other_params=1234',
                            ],
                            [
                              'dashboard',
                              () => {
                                window.history.pushState(
                                  null,
                                  null,
                                  '/dashboard'
                                );
                              },
                              'https://mock.testing.com/dashboard',
                            ],
                            [
                              'dashboard with extra prarams',
                              () => {
                                window.history.pushState(
                                  null,
                                  null,
                                  '/dashboard?other_params=1234'
                                );
                              },
                              'https://mock.testing.com/dashboard?other_params=1234',
                            ],
                          ])(
                            'current page is %p',
                            (pageName, changePageAction, expectedReturnUrl) => {
                              beforeEach(() => {
                                changePageAction();
                              });

                              afterEach(() => {
                                window.history.replaceState(null, null, '/');
                              });

                              test('return url', () => {
                                let casParams = {
                                  path: '/cas-path',
                                  version: casVersion,
                                  protocol: casProtocol,
                                };
                                if (proxyCallbackUrl) {
                                  casParams.proxy_callback_url =
                                    proxyCallbackUrl;
                                }
                                if (validationProxy) {
                                  casParams.validation_proxy = validationProxy;
                                }
                                if (validationProxyProtocol) {
                                  casParams.validation_proxy_protocol =
                                    validationProxyProtocol;
                                }
                                if (validationProxyEndpoint) {
                                  casParams.validation_proxy_endpoint =
                                    validationProxyEndpoint;
                                }
                                if (validationProxyPath) {
                                  casParams.validation_proxy_path =
                                    validationProxyPath;
                                }
                                let expectedValidationUrlLeading = '';
                                if (!validationProxy) {
                                  expectedValidationUrlLeading =
                                    casProtocol + '://fake.cas.com/cas-path';
                                } else {
                                  let protocal = 'https';
                                  let endpoint = 'mock.testing.com';
                                  let path = '';
                                  if (validationProxyProtocol) {
                                    protocal = validationProxyProtocol;
                                  }
                                  if (validationProxyEndpoint) {
                                    endpoint = validationProxyEndpoint;
                                  }
                                  if (validationProxyPath) {
                                    path = validationProxyPath;
                                  }
                                  expectedValidationUrlLeading =
                                    protocal + '://' + endpoint + path;
                                }

                                let expectedValidationUrl =
                                  expectedValidationUrlLeading +
                                  casServicePath +
                                  '?service=' +
                                  encodeURIComponent(expectedReturnUrl) +
                                  '&ticket=Mock-Ticket-123456786543212345678' +
                                  casExtraParamStr;
                                if (proxyCallbackUrl) {
                                  expectedValidationUrl +=
                                    '&pgtUrl=' +
                                    encodeURIComponent(proxyCallbackUrl);
                                }

                                const cas = new CasClient(
                                  'fake.cas.com',
                                  casParams
                                );
                                expect(
                                  url.getValidateUrl(
                                    cas,
                                    'Mock-Ticket-123456786543212345678'
                                  )
                                ).toBe(expectedValidationUrl);
                              });
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
});
