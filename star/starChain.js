const level = require('level');
const chainDB = './star_chaindata';
const db = level(chainDB);

const moment = require('moment');
const SHA256 = require('crypto-js/sha256');

const colors = require('colors/safe');

const Helpers = require('./helpers');

// These will be used as minutes
const ttl = 5;

class Starchain {
  async addRequest(requestBody, bool) {
    requestBody.requestTimeStamp = moment().unix();
    requestBody.expiringUnix = moment()
      .add(ttl, 'minutes')
      .unix();
    return await addRequestTolevelDB(
      requestBody.address,
      JSON.stringify(requestBody),
      bool
    );
  }

  async checkRequest(address) {
    return await checkRequestInlevelDB(address);
  }

  async checkRequestStatus() {
    return await checkRequestStatusInlevelDB();
  }

  async deleteRequest(key) {
    return await deleteStoredRequestsInlevelDB(key);
  }
}

function addRequestTolevelDB(key, value, bool) {
  return new Promise((resolve, reject) => {
    value = JSON.parse(value);
    value.messageSignature = bool || false;
    value.message = [
      value.address,
      value.requestTimeStamp,
      'starRegistry'
    ].join(':');
    value = JSON.stringify(value);
    db.put(key, value, err => {
      if (err) {
        reject(err);
      }
      let creationOrupdate = '';
      if (bool) {
        creationOrupdate = '\n[$] Your signed request was validated!';
      } else {
        creationOrupdate =
          '\n[+] Great! Request ' + key + ' was added! ' + value;
      }
      resolve(console.log(creationOrupdate));
    });
  }).then(() => value);
}

function checkRequestInlevelDB(address) {
  return new Promise((resolve, reject) => {
    db.get(address, (err, value) => {
      if (err) {
        reject(err);
      }
      resolve(value);
    });
  });
}

function checkRequestStatusInlevelDB() {
  return new Promise((resolve, reject) => {
    let i = -1;
    db
      .createReadStream()
      .on('data', data => {
        const requestExpBool = Helpers.validationWindowStatus(
          JSON.parse(data.value)
        );
        if (
          requestExpBool.res === false &&
          JSON.parse(data.value).messageSignature === false
        ) {
          deleteStoredRequestsInlevelDB(data.key, requestExpBool.outOfTime);
        }
        i++;
      })
      .on('error', error => {
        reject(err);
      })
      .on('close', () => {
        resolve(i);
      });
  });
}

function deleteStoredRequestsInlevelDB(key, expiredFormatted) {
  return new Promise((resolve, reject) => {
    db.del(key, err => {
      if (err) {
        reject(err);
      } else if (expiredFormatted) {
        console.log(
          '\n[-] Request with key:',
          key,
          'was deleted! [Expired:',
          expiredFormatted,
          ']'
        );
      } else {
        console.log(
          '\n[-] Request with key:',
          key,
          'was deleted after star creation'
        );
      }
    });
  });
}

module.exports = Starchain;
