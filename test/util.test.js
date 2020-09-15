const util = require('../src/util');

describe('isEmpty()', () => {
  test.each([
    ['undefined', undefined, true],
    ['null', null, true],
    ['all space', '           ', true],
    ['false', false, false],
    ['true', false, false],
    ['Any string', 'ABCD', false],
    ['Any integer', 12334, false],
  ])('given value is %s', (label, params, expectedReturn) => {
    expect(util.isEmpty(params)).toBe(expectedReturn);
  });
});

describe('throwError()', () => {
  test('should throw error with message', () => {
    let errorMessage = 'Mock Error Message';
    expect(() => {
      util.throwError(errorMessage);
    }).toThrow('[CasClient]: Mock Error Message');
  });
});

describe('getCurrentUrl()', () => {
  afterEach(() => {
    window.history.replaceState(null, null, '/');
  });

  describe.each([
    [
      'index page',
      () => {},
      {
        wo_ticket: 'https://mock.testing.com/',
        w_ticket:
          'https://mock.testing.com/?ticket=MOCK-TICKET-12345657898765432',
      },
    ],
    [
      'not index page',
      () => {
        window.history.pushState(null, null, '/dashboard');
      },
      {
        wo_ticket: 'https://mock.testing.com/dashboard',
        w_ticket:
          'https://mock.testing.com/dashboard?ticket=MOCK-TICKET-12345657898765432',
      },
    ],
  ])('current page is %s', (pageName, changePageAction, expectedReturn) => {
    beforeEach(() => {
      changePageAction();
    });

    describe('contains ticket', () => {
      beforeEach(() => {
        window.history.pushState(
          null,
          null,
          '?ticket=MOCK-TICKET-12345657898765432'
        );
      });

      test('withoutTicket is true', () => {
        expect(util.getCurrentUrl(true)).toBe(expectedReturn.wo_ticket);
      });

      test('withoutTicket is false', () => {
        expect(util.getCurrentUrl(false)).toBe(expectedReturn.w_ticket);
      });
    });

    describe('not contains ticket', () => {
      test.each([[true], [false]])('withoutTicket is %p', (withoutTicket) => {
        expect(util.getCurrentUrl(withoutTicket)).toBe(
          expectedReturn.wo_ticket
        );
      });
    });
  });
});

describe('getParamFromCurrentUrl()', () => {
  afterEach(() => {
    window.history.replaceState(null, null, '/');
  });

  test('return value when key exists', () => {
    window.history.pushState(null, null, '?any_key=any_value');
    expect(util.getParamFromCurrentUrl('any_key')).toBe('any_value');
  });

  test('return null when key not exists', () => {
    expect(util.getParamFromCurrentUrl('any_key')).toBeNull();
  });
});

describe('getFullProtocol()', () => {
  test.each([
    ['incorrect protocol', 'ftp', 'https://'],
    ['https', 'https', 'https://'],
    ['http', 'http', 'http://'],
  ])('%s is given', (label, params, expectedReturn) => {
    expect(util.getFullProtocol(params)).toBe(expectedReturn);
  });
});
