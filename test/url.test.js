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
      describe.each([
        [true, 'https://mock.testing.com/mock_proxy_path/cas-path'],
        [false, casProtocol + '://fake.cas.com/cas-path'],
      ])(
        'validate proxy path set: %p',
        (proxyPathSet, expectedValidationUrlLeading) => {
          describe.each([
            ['index', () => {}, 'https://mock.testing.com/'],
            [
              'index with extra params',
              () => {
                window.history.pushState(null, null, '/?other_params=1234');
              },
              'https://mock.testing.com/?other_params=1234',
            ],
            [
              'dashboard',
              () => {
                window.history.pushState(null, null, '/dashboard');
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
                if (proxyPathSet) {
                  casParams.validation_proxy_path = '/mock_proxy_path';
                }
                let expectedValidationUrl =
                  expectedValidationUrlLeading +
                  casServicePath +
                  '?service=' +
                  encodeURIComponent(expectedReturnUrl) +
                  '&ticket=Mock-Ticket-123456786543212345678' +
                  casExtraParamStr;
                let cas = new CasClient('fake.cas.com', casParams);
                expect(
                  url.getValidateUrl(cas, 'Mock-Ticket-123456786543212345678')
                ).toBe(expectedValidationUrl);
              });
            }
          );
        }
      );
    });
  });
});
