jest.mock('node-fetch');

const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');

const constant = require('../src/constant');
const CasClient = require('../src/index').default;

const oldLocation = global.window.location;

let mockValidTicketResponse_2_0 =
  '<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas"><cas:authenticationSuccess><cas:user>casusername</cas:user></cas:authenticationSuccess></cas:serviceResponse>';
let mockValidTicketWithPGTResponse_2_0 =
  '<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas"><cas:authenticationSuccess><cas:user>casusername</cas:user><cas:proxyGrantingTicket>PGTIOU-000000-000000</cas:proxyGrantingTicket></cas:authenticationSuccess></cas:serviceResponse>';
let mockInvalidTicketResponse_2_0 =
  '<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas"><cas:authenticationFailure code="RANDOM_ERROR_CODE_FROM_RESPONSE"> Ticket MOCK-TICKET-123456522 not recognized </cas:authenticationFailure></cas:serviceResponse>';
let mockInvalidTicketFormatResponse_2_0 = '<fake>';

let mockValidTicketResponse_3_0 =
  '{"serviceResponse" : {"authenticationSuccess" : {"user" : "casusername","attributes" : {}}}}';
let mockValidTicketWithPGTResponse_3_0 =
  '{"serviceResponse" : {"authenticationSuccess" : {"user" : "casusername","proxyGrantingTicket": "PGTIOU-000000-000000","attributes" : {}}}}';
let mockInvalidTicketResponse_3_0 =
  '{"serviceResponse" : {"authenticationFailure" : {"code" : "RANDOM_ERROR_CODE_FROM_RESPONSE","description" : "Ticket MOCK-TICKET-123456522 not recognized"}}}';
let mockInvalidTicketFormatResponse_3_0 = '{]';

beforeEach(() => {
  window.history.pushState(null, null, '/');

  const oldLocation = global.window.location;
  delete global.window.location;
  global.window.location = { ...oldLocation };
});

afterEach(() => {
  global.window.location = oldLocation;
});

describe('CasClient', () => {
  describe('constructor', () => {
    test('default options', () => {
      let cas = new CasClient('fake.cas.com');
      expect(cas.endpoint).toBe('fake.cas.com');
      expect(cas.path).toBe('/cas');
      expect(cas.protocol).toBe('https');
      expect(cas.version).toBe('3.0');
      expect(cas.validation_proxy_path).toBe('');
      expect(cas.redirectUrl).toBe('https://mock.testing.com/');
    });

    test('options', () => {
      let cas = new CasClient('fake.cas.com', {
        path: '/custom-cas-path',
        protocol: 'http',
        version: constant.CAS_VERSION_2_0,
        validation_proxy_path: 'custom-validation-proxy-path',
      });
      expect(cas.endpoint).toBe('fake.cas.com');
      expect(cas.path).toBe('/custom-cas-path');
      expect(cas.protocol).toBe('http');
      expect(cas.version).toBe('2.0');
      expect(cas.validation_proxy_path).toBe('custom-validation-proxy-path');
      expect(cas.redirectUrl).toBe('https://mock.testing.com/');
    });
  });

  describe.each([
    [
      constant.CAS_VERSION_2_0,
      {
        login: { path: '/login' },
        logout: { path: '/logout', service_key: 'url' },
        validate: {
          path: '/serviceValidate',
          params_str: '',
          fetch_mock: {
            validTicket: () => {
              fetch.mockReturnValueOnce(
                Promise.resolve(new Response(mockValidTicketResponse_2_0))
              );
            },
            validTicketWithPGT: () => {
              fetch.mockReturnValueOnce(
                Promise.resolve(
                  new Response(mockValidTicketWithPGTResponse_2_0)
                )
              );
            },
            invalidTicket: () => {
              fetch.mockReturnValueOnce(
                Promise.resolve(new Response(mockInvalidTicketResponse_2_0))
              );
            },
            invalidFormat: () => {
              fetch.mockReturnValueOnce(
                Promise.resolve(
                  new Response(mockInvalidTicketFormatResponse_2_0)
                )
              );
            },
            fails: () => {
              fetch.mockImplementationOnce(() => Promise.reject('Fake Error'));
            },
          },
        },
      },
    ],
    [
      constant.CAS_VERSION_3_0,
      {
        login: { path: '/login' },
        logout: { path: '/logout', service_key: 'service' },
        validate: {
          path: '/p3/serviceValidate',
          params_str: '&format=json',
          fetch_mock: {
            validTicket: () => {
              fetch.mockReturnValueOnce(
                Promise.resolve(new Response(mockValidTicketResponse_3_0))
              );
            },
            validTicketWithPGT: () => {
              fetch.mockReturnValueOnce(
                Promise.resolve(
                  new Response(mockValidTicketWithPGTResponse_3_0)
                )
              );
            },
            invalidTicket: () => {
              fetch.mockReturnValueOnce(
                Promise.resolve(new Response(mockInvalidTicketResponse_3_0))
              );
            },
            invalidFormat: () => {
              fetch.mockReturnValueOnce(
                Promise.resolve(
                  new Response(mockInvalidTicketFormatResponse_3_0)
                )
              );
            },
            fails: () => {
              fetch.mockImplementationOnce(() => Promise.reject('Fake Error'));
            },
          },
        },
      },
    ],
  ])('cas version: %p', (casVersion, casExpectedServices) => {
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
                            [
                              'index page',
                              () => {},
                              '/',
                              'https://mock.testing.com/',
                            ],
                            [
                              'dashboard page',
                              () => {
                                global.window.location.pathname = '/dashboard';
                                global.window.location.href =
                                  'https://mock.testing.com/dashboard';
                              },
                              '/dashboard',
                              'https://mock.testing.com/dashboard',
                            ],
                          ])(
                            'Current page: %p',
                            (
                              pageName,
                              goToStartPageAction,
                              expectedCurrentPath,
                              expectedCurrentUrl
                            ) => {
                              let casParams;
                              let expectedCasUrlLeadings;

                              beforeEach(() => {
                                goToStartPageAction();

                                expectedCasUrlLeadings = {
                                  login: '',
                                  logout: '',
                                  validate: '',
                                };
                                casParams = {
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

                                expectedCasUrlLeadings.login =
                                  casProtocol + '://fake.cas.com/cas-path';
                                expectedCasUrlLeadings.logout =
                                  casProtocol + '://fake.cas.com/cas-path';
                                expectedCasUrlLeadings.validate =
                                  casProtocol + '://fake.cas.com/cas-path';
                              });

                              describe('logout()', () => {
                                let cas;
                                let expectedBaseLogoutUrl;

                                beforeEach(() => {
                                  cas = new CasClient(
                                    'fake.cas.com',
                                    casParams
                                  );
                                  expectedBaseLogoutUrl =
                                    expectedCasUrlLeadings.logout +
                                    casExpectedServices.logout.path;
                                });

                                test('no path is specific', () => {
                                  cas.logout();
                                  expect(window.location.href).toBe(
                                    expectedBaseLogoutUrl
                                  );
                                });

                                test('path is specific', () => {
                                  cas.logout('/redirect-logout');
                                  expect(window.location.href).toBe(
                                    expectedBaseLogoutUrl +
                                      '?' +
                                      casExpectedServices.logout.service_key +
                                      '=' +
                                      encodeURIComponent(
                                        'https://mock.testing.com/redirect-logout'
                                      )
                                  );
                                });
                              });

                              describe('auth()', () => {
                                let cas;
                                let expectedLoginBaseUrl;

                                beforeEach(() => {
                                  expectedLoginBaseUrl =
                                    expectedCasUrlLeadings.login +
                                    casExpectedServices.login.path +
                                    '?service=' +
                                    encodeURIComponent(
                                      expectedCurrentUrl + '?status=in_process'
                                    );
                                });

                                describe.each([
                                  [
                                    'first auth call',
                                    () => {},
                                    {
                                      gateway_true: () => {
                                        test('result', () => {
                                          cas.auth(true);
                                          expect(window.location.href).toBe(
                                            expectedLoginBaseUrl +
                                              '&gateway=true'
                                          );
                                        });
                                      },
                                      gateway_false: () => {
                                        test('result', () => {
                                          cas.auth(false);
                                          expect(window.location.href).toBe(
                                            expectedLoginBaseUrl
                                          );
                                        });
                                      },
                                      gateway_not_specific: () => {
                                        test('result', () => {
                                          cas.auth();
                                          expect(window.location.href).toBe(
                                            expectedLoginBaseUrl
                                          );
                                        });
                                      },
                                    },
                                  ],
                                  [
                                    'Redriect from cas without ticket',
                                    () => {
                                      global.window.location.pathname =
                                        expectedCurrentPath;
                                      global.window.location.href =
                                        expectedCurrentUrl +
                                        '?status=in_process';
                                    },
                                    {
                                      gateway_true: () => {
                                        test('result', () => {
                                          return expect(
                                            cas.auth(true)
                                          ).rejects.toEqual({
                                            currentPath: expectedCurrentPath,
                                            currentUrl: expectedCurrentUrl,
                                            type: 'AUTH_ERROR',
                                            message:
                                              'Missing ticket from return url',
                                          });
                                        });
                                      },
                                      gateway_false: () => {
                                        test('result', () => {
                                          return expect(
                                            cas.auth(false)
                                          ).rejects.toEqual({
                                            currentPath: expectedCurrentPath,
                                            currentUrl: expectedCurrentUrl,
                                            type: 'AUTH_ERROR',
                                            message:
                                              'Missing ticket from return url',
                                          });
                                        });
                                      },
                                      gateway_not_specific: () => {
                                        test('result', () => {
                                          return expect(
                                            cas.auth()
                                          ).rejects.toEqual({
                                            currentPath: expectedCurrentPath,
                                            currentUrl: expectedCurrentUrl,
                                            type: 'AUTH_ERROR',
                                            message:
                                              'Missing ticket from return url',
                                          });
                                        });
                                      },
                                    },
                                  ],
                                  [
                                    'Redriect from cas with ticket',
                                    () => {
                                      global.window.location.pathname =
                                        expectedCurrentPath;
                                      global.window.location.href =
                                        expectedCurrentUrl +
                                        '?status=in_process&ticket=MOCK-TICKET-123456522';
                                    },
                                    {
                                      gateway_true: () => {
                                        test('Valid ticket', () => {
                                          if (!proxyCallbackUrl) {
                                            casExpectedServices.validate.fetch_mock.validTicket();
                                            return expect(
                                              cas.auth(true)
                                            ).resolves.toEqual({
                                              currentPath: expectedCurrentPath,
                                              currentUrl: expectedCurrentUrl,
                                              user: 'casusername',
                                            });
                                          } else {
                                            casExpectedServices.validate.fetch_mock.validTicketWithPGT();
                                            return expect(
                                              cas.auth(true)
                                            ).resolves.toEqual({
                                              currentPath: expectedCurrentPath,
                                              currentUrl: expectedCurrentUrl,
                                              user: 'casusername',
                                              pgtIou: 'PGTIOU-000000-000000',
                                            });
                                          }
                                        });

                                        test('Invalid ticket', () => {
                                          casExpectedServices.validate.fetch_mock.invalidTicket();
                                          return expect(
                                            cas.auth(true)
                                          ).rejects.toEqual({
                                            currentPath: expectedCurrentPath,
                                            currentUrl: expectedCurrentUrl,
                                            type: 'AUTH_ERROR',
                                            message:
                                              'Ticket MOCK-TICKET-123456522 not recognized',
                                            code: 'RANDOM_ERROR_CODE_FROM_RESPONSE',
                                          });
                                        });

                                        test('Failed to parse response', () => {
                                          casExpectedServices.validate.fetch_mock.invalidFormat();
                                          return expect(
                                            cas.auth(true)
                                          ).rejects.toMatchObject({
                                            currentPath: expectedCurrentPath,
                                            currentUrl: expectedCurrentUrl,
                                            type: 'PARSE_RESPONSE_ERROR',
                                            message: 'Failed to parse response',
                                          });
                                        });

                                        test('Fetch fails', () => {
                                          casExpectedServices.validate.fetch_mock.fails();
                                          return expect(
                                            cas.auth(true)
                                          ).rejects.toMatchObject({
                                            currentPath: expectedCurrentPath,
                                            currentUrl: expectedCurrentUrl,
                                            type: 'FETCH_ERROR',
                                            message:
                                              'Failed to connect CAS server',
                                          });
                                        });
                                      },
                                      gateway_false: () => {
                                        test('Valid ticket', () => {
                                          if (!proxyCallbackUrl) {
                                            casExpectedServices.validate.fetch_mock.validTicket();
                                            return expect(
                                              cas.auth(false)
                                            ).resolves.toEqual({
                                              currentPath: expectedCurrentPath,
                                              currentUrl: expectedCurrentUrl,
                                              user: 'casusername',
                                            });
                                          } else {
                                            casExpectedServices.validate.fetch_mock.validTicketWithPGT();
                                            return expect(
                                              cas.auth(false)
                                            ).resolves.toEqual({
                                              currentPath: expectedCurrentPath,
                                              currentUrl: expectedCurrentUrl,
                                              user: 'casusername',
                                              pgtIou: 'PGTIOU-000000-000000',
                                            });
                                          }
                                        });

                                        test('Invalid ticket', () => {
                                          casExpectedServices.validate.fetch_mock.invalidTicket();
                                          return expect(
                                            cas.auth(false)
                                          ).rejects.toEqual({
                                            currentPath: expectedCurrentPath,
                                            currentUrl: expectedCurrentUrl,
                                            type: 'AUTH_ERROR',
                                            message:
                                              'Ticket MOCK-TICKET-123456522 not recognized',
                                            code: 'RANDOM_ERROR_CODE_FROM_RESPONSE',
                                          });
                                        });

                                        test('Failed to parse response', () => {
                                          casExpectedServices.validate.fetch_mock.invalidFormat();
                                          return expect(
                                            cas.auth(false)
                                          ).rejects.toMatchObject({
                                            currentPath: expectedCurrentPath,
                                            currentUrl: expectedCurrentUrl,
                                            type: 'PARSE_RESPONSE_ERROR',
                                            message: 'Failed to parse response',
                                          });
                                        });

                                        test('Fetch fails', () => {
                                          casExpectedServices.validate.fetch_mock.fails();
                                          return expect(
                                            cas.auth(false)
                                          ).rejects.toMatchObject({
                                            currentPath: expectedCurrentPath,
                                            currentUrl: expectedCurrentUrl,
                                            type: 'FETCH_ERROR',
                                            message:
                                              'Failed to connect CAS server',
                                          });
                                        });
                                      },
                                      gateway_not_specific: () => {
                                        test('Valid ticket', () => {
                                          if (!proxyCallbackUrl) {
                                            casExpectedServices.validate.fetch_mock.validTicket();
                                            return expect(
                                              cas.auth()
                                            ).resolves.toEqual({
                                              currentPath: expectedCurrentPath,
                                              currentUrl: expectedCurrentUrl,
                                              user: 'casusername',
                                            });
                                          } else {
                                            casExpectedServices.validate.fetch_mock.validTicketWithPGT();
                                            return expect(
                                              cas.auth()
                                            ).resolves.toEqual({
                                              currentPath: expectedCurrentPath,
                                              currentUrl: expectedCurrentUrl,
                                              user: 'casusername',
                                              pgtIou: 'PGTIOU-000000-000000',
                                            });
                                          }
                                        });

                                        test('Invalid ticket', () => {
                                          casExpectedServices.validate.fetch_mock.invalidTicket();
                                          return expect(
                                            cas.auth()
                                          ).rejects.toEqual({
                                            currentPath: expectedCurrentPath,
                                            currentUrl: expectedCurrentUrl,
                                            type: 'AUTH_ERROR',
                                            message:
                                              'Ticket MOCK-TICKET-123456522 not recognized',
                                            code: 'RANDOM_ERROR_CODE_FROM_RESPONSE',
                                          });
                                        });

                                        test('Failed to parse response', () => {
                                          casExpectedServices.validate.fetch_mock.invalidFormat();
                                          return expect(
                                            cas.auth()
                                          ).rejects.toMatchObject({
                                            currentPath: expectedCurrentPath,
                                            currentUrl: expectedCurrentUrl,
                                            type: 'PARSE_RESPONSE_ERROR',
                                            message: 'Failed to parse response',
                                          });
                                        });

                                        test('Fetch fails', () => {
                                          casExpectedServices.validate.fetch_mock.fails();
                                          return expect(
                                            cas.auth()
                                          ).rejects.toMatchObject({
                                            currentPath: expectedCurrentPath,
                                            currentUrl: expectedCurrentUrl,
                                            type: 'FETCH_ERROR',
                                            message:
                                              'Failed to connect CAS server',
                                          });
                                        });
                                      },
                                    },
                                  ],
                                ])(
                                  '%p',
                                  (
                                    label,
                                    casRedirectionAction,
                                    expectedChecks
                                  ) => {
                                    beforeEach(() => {
                                      casRedirectionAction();
                                    });

                                    afterEach(() => {
                                      window.history.replaceState(
                                        null,
                                        null,
                                        '/'
                                      );
                                    });

                                    describe.each([[true], [false]])(
                                      'gateway: %p',
                                      (gateway) => {
                                        beforeEach(() => {
                                          cas = new CasClient(
                                            'fake.cas.com',
                                            casParams
                                          );
                                        });

                                        if (gateway) {
                                          expectedChecks.gateway_true(cas);
                                        } else {
                                          expectedChecks.gateway_false(cas);
                                        }
                                      }
                                    );

                                    describe('gateway is not specific', () => {
                                      expectedChecks.gateway_not_specific(cas);
                                    });
                                  }
                                );
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
