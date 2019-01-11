const SHA256 = require('crypto-js/sha256');

const moment = require('moment');

const Block = require('../bc/Block.js');
const Blockchain = require('../bc/simpleChain');
let blockchain = new Blockchain();

const Starchain = require('../star/starChain');
let starchain = new Starchain();

const Helpers = require('../star/helpers');

const _ = require('lodash');

const hex2ascii = require('hex2ascii');
const bitcoinMessage = require('bitcoinjs-message');

// Clean expired request on init and every 5 minutes
starchain.checkRequestStatus();
setInterval(() => starchain.checkRequestStatus(), 300000);

class StarController {
  constructor(app) {
    this.app = app;
    this.blocks = [];
    this.registerStar();
    this.validate();
    this.requestValidation();
    this.starByAddress();
    this.starByHeight();
    this.starByHash();
    this.otherRoutes();
  }

  starByAddress() {
    this.app.get('/stars/address:address', async (req, res) => {
      try {
        const addArr = await blockchain.getBlocksByValueAttribute(
          req.params.address.replace(':', '')
        );
        if (addArr) {
          res.send(addArr);
        } else {
          sharedKeyNotFound('404', res, 'I don´t have that address!');
        }
      } catch (err) {
        console.log(err);
      }
    });
  }

  starByHeight() {
    this.app.get('/block/:height', async (req, res) => {
      try {
        const getBlockViaWS = await blockchain.getBlock(req.params.height);
        let block = JSON.parse(getBlockViaWS);
        if (req.params.height != 0) {
          block.star.storyDecoded = hex2ascii(block.star.story);
        }
        res.send(block);
      } catch (err) {
        sharedKeyNotFound(err, res, 'I don´t have that block!');
      }
    });
  }

  starByHash() {
    this.app.get('/stars/hash:hash', async (req, res) => {
      try {
        const getBlockViaWS = await blockchain.getBlockByHash(
          req.params.hash.replace(':', '')
        );
        if (getBlockViaWS) {
          let block = JSON.parse(getBlockViaWS);
          block.star.storyDecoded = hex2ascii(block.star.story);
          res.send(block);
        } else {
          sharedKeyNotFound(404, res, 'I don´t have a block with that hash!');
        }
      } catch (err) {
        sharedKeyNotFound(err, res, 'Something went wrong!');
      }
    });
  }

  registerStar() {
    this.app.post('/block', async (req, res) => {
      const ifMissingParams = await Helpers.validateUserInput(req.body, [
        'dec',
        'ra',
        'story'
      ]);
      try {
        if (!req.body.address) {
          res.status(400);
          res.send({
            error: 'I need a Wallet...!'
          });
          return;
        }
        const address = JSON.parse(
          await starchain.checkRequest(req.body.address)
        );
        if (!address) {
          res.status(404);
          res.send({
            error: 'I don´t have that wallet or address!'
          });
        }
        if (req.body.star) {
          if (!ifMissingParams) {
            if (address && address.messageSignature) {
              let starBody = req.body;
              if (!Helpers.isASCII(starBody.star.story)) {
                res.status(400);
                res.send({
                  error: 'We only accept ASCII characters...!'
                });
              } else if (
                Buffer.byteLength(starBody.star.story, 'ascii') >= 500
              ) {
                res.status(400);
                res.send({
                  error: 'Star story should be less than 500 bytes'
                });
              } else {
                // We dont want to store the decoded story
                //starBody.star.storyDecoded = '';
                starBody.star.story = Buffer(starBody.star.story).toString(
                  'hex'
                );
              }

              await blockchain.addBlock(starBody).then(async value => {
                value = JSON.parse(value);
                value.star.storyDecoded = hex2ascii(value.star.story);
                res.send(value);
                await starchain.deleteRequest(address.address);
              });
            } else {
              res.status(400);
              res.send({
                error: 'You need to validate your request...!'
              });
            }
          } else {
            res.status(400);
            res.send({
              error: ifMissingParams
            });
          }
        } else {
          res.status(400);
          res.send({
            error: 'I need a Star property...!'
          });
        }
      } catch (err) {
        //console.log(err);
        if (/Key not found in database/gm.test(err)) {
          res.status(404);
          res.send({
            error: 'I don´t have that wallet or address!'
          });
        } else {
          res.status(400);
          res.send({
            error: 'I was not able to process your request...!'
          });
        }
      }
    });
  }

  validate() {
    this.app.post('/message-signature/validate', async (req, res) => {
      const ifMissingParams = await Helpers.validateUserInput(req.body, [
        'address',
        'signature'
      ]);
      try {
        if (ifMissingParams) {
          res.status(400);
          res.send({
            error: ifMissingParams
          });
        } else {
          await starchain.checkRequest(req.body.address).then(async value => {
            if (await Helpers.validationWindowStatus(JSON.parse(value)).res) {
              if (
                !JSON.parse(value).messageSignature &&
                bitcoinMessage.verify(
                  JSON.parse(value).message,
                  req.body.address,
                  req.body.signature
                )
              ) {
                await starchain
                  .addRequest(JSON.parse(value), true)
                  .then(value => {
                    // Change review remove expiringUnix property from display response on submit signature
                    value = _.omit(JSON.parse(value), ['expiringUnix']);
                    res.send(value);
                  });
              } else if (JSON.parse(value).messageSignature) {
                res.status(400);
                res.send({
                  message: 'Request validated previously!'
                });
              } else {
                res.status(400);
                res.send({
                  message:
                    'We cannot verify your signature. Please, re-check the provided information or contact an admin at admin@admin.admin'
                });
              }
            } else {
              res.status(400);
              res.send({
                message: 'First you need to create the request!'
              });
            }
          });
        }
      } catch (err) {
        res.status(400);
        res.send({
          error: 'I was not able to process your request...!'
        });
      }
    });
  }

  requestValidation() {
    this.app.post('/requestValidation', async (req, res) => {
      if (!req.body.address) {
        res.status(400);
        res.send({
          error: 'I need a Wallet...!'
        });
        return;
      }
      try {
        await starchain.checkRequest(req.body.address).then(
          async value => {
            const status = await Helpers.validationWindowStatus(
              JSON.parse(value)
            );
            //if (JSON.parse(value).messageSignature) {} else
            if (status.res) {
              console.log(
                '\n[!] I have this request',
                value,
                'and it is still valid!'
              );
            } else {
              console.log(
                '\n[X] The time for validating this request expired!'
              );
            }
            res.send(
              await Helpers.validationWindowStatusWithBool(
                JSON.parse(value),
                status
              )
            );
          },
          async reason => {
            await starchain.addRequest(req.body).then(value => {
              value = JSON.parse(value);
              value.validationWindow = value.expiringUnix - moment().unix();

              // Change review remove expiringUnix property from display response on submit request (first time)
              value = _.omit(value, ['expiringUnix']);
              res.send(value);
            });
          }
        );
      } catch (err) {
        res.status(409);
        res.send({
          error: 'I was not able to add that request...!'
        });
      }
    });
  }

  otherRoutes() {
    this.app.get('*', (req, res) => {
      sharedResponseOtherRoutes(res);
    });

    this.app.post('*', (req, res) => {
      sharedResponseOtherRoutes(res);
    });

    function sharedResponseOtherRoutes(res) {
      res.status(404);
      res.send({
        error: 'I have limited routes. Please, check the README.md'
      });
    }
  }
}

function sharedKeyNotFound(err, res, msg) {
  if (/Key not found in database/gm.test(err) || err == 404) {
    res.status(404);
    res.send({
      error: msg
    });
  } else {
    res.status(400);
    res.send({
      error: 'I was not able to process your request...!'
    });
  }
}

module.exports = app => {
  return new StarController(app);
};
