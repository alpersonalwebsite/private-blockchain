const moment = require('moment');
const _ = require('lodash');

exports.validateUserInput = async function(req, expectedParams) {
  if (req.star) {
    req = req.star;
  }

  const filterParams = await _.difference(expectedParams, _.keys(req));

  if (filterParams.length) {
    const errorMsg = `Missing parameter${
      filterParams.length > 1 ? 's' : ''
    }: ${filterParams.join(', ')}`;
    return errorMsg;
  }
  return false;
};

exports.validationWindowStatus = function(obj) {
  const outOfTime = moment.unix(obj.expiringUnix).fromNow();
  const regex = /^\in/gm;
  const res = regex.test(outOfTime);
  const validationWindow = obj.expiringUnix - moment().unix();
  return (valObj = {
    res,
    outOfTime,
    validationWindow
  });
};

exports.validationWindowStatusWithBool = function(obj, valObj) {
  // Change review remove expiringUnix property from display response on submit same request without validating it (different than fgirst time)
  /*
  let resToSend = {
    ...obj
  };

*/

  let resToSend = _.omit({ ...obj }, ['expiringUnix']);
  //

  if (valObj.res || resToSend.messageSignature) {
    resToSend.message = [
      obj.address,
      obj.requestTimeStamp,
      'starRegistry'
    ].join(':');

    if (!resToSend.messageSignature) {
      resToSend.validationWindow = valObj.validationWindow;
      /* Change review remove remainingTime property from display response
      resToSend.remainingTime =
        'You still have time. Your request will expire ' +
        valObj.outOfTime +
        ' (aprox)';
        */
    }
    return resToSend;
  } else {
    return {
      msg: 'Your time for validating the request expired!'
    };
  }
};

// Credits zzzzBov - https://stackoverflow.com/questions/14313183/javascript-regex-how-do-i-check-if-the-string-is-ascii-only
exports.isASCII = function(str) {
  return /^[\x00-\x7F]*$/.test(str);
};
