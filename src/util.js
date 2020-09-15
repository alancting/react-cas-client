const isEmpty = (obj) => {
  return (
    obj === undefined ||
    obj === null ||
    obj.toString().replace(/\s/g, '') === ''
  );
};

const throwError = (err) => {
  throw new Error('[CasClient]: ' + err);
};

const getCurrentUrl = (withoutTicket = true) => {
  let url = window.location.href;
  if (withoutTicket) {
    return url.replace(/(^|[&?])ticket(=[^&]*)?/, '');
  }
  return url;
};

const getParamFromCurrentUrl = (param) => {
  return new URL(window.location.href).searchParams.get(param);
};

const getFullProtocol = (protocol) => {
  return protocol === 'http' ? 'http://' : 'https://';
};

export {
  isEmpty,
  throwError,
  getCurrentUrl,
  getParamFromCurrentUrl,
  getFullProtocol,
};
