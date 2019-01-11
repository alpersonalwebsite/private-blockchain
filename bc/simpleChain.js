const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

const SHA256 = require('crypto-js/sha256');

const colors = require('colors/safe');

const _ = require('lodash');

const hex2ascii = require('hex2ascii');

const Block = require('./Block.js');

class Blockchain {
  constructor() {
    this.getBlockHeight()
      .then(blockHeight => {
        if (blockHeight === -1) {
          console.log('No Genesis block... Yet!');
          this.addBlock(new Block('First block in the chain - Genesis block'))
            .then(() => console.log('Genesis added!'))
            .catch(err => {
              console.log(err);
            });
        }
      })
      .catch(err => {
        console.log(err);
      });
  }

  async addBlock(newBlock) {
    let height = await this.getBlockHeight();

    newBlock.height = height + 1;

    newBlock.time = new Date()
      .getTime()
      .toString()
      .slice(0, -3);

    if (newBlock.height > 0) {
      let prevHash = await this.getBlock(newBlock.height - 1);

      newBlock.previousBlockHash = JSON.parse(prevHash).hash;
    }

    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

    return await addBlockTolevelDB(newBlock.height, JSON.stringify(newBlock));
  }

  async getBlockHeight() {
    return await getBlockHeightlevelDB();
  }

  async getBlockByHash(hash) {
    return await getBlockByHashlevelDB(hash);
  }

  async getBlock(key) {
    return await getBlockDatalevelDB(key);
  }

  async getBlocksByValueAttribute(attribute) {
    return await getBlocksByValueAttributelevelD(attribute);
  }

  async forceError(key, blockBody, fakeHash) {
    return await forceErrorlevelDB(key, blockBody, fakeHash);
  }

  async validateBlock(blockHeight) {
    let block = await this.getBlock(blockHeight);
    block = JSON.parse(block);

    let blockHash = block.hash;

    block.hash = '';

    let validBlockHash = SHA256(JSON.stringify(block)).toString();

    if (blockHash === validBlockHash) {
      console.log(colors.green('Valid block!'));
      return true;
    } else {
      console.log(
        colors.red(
          'Block #' +
            blockHeight +
            ' invalid hash:\n' +
            blockHash +
            '<>' +
            validBlockHash
        )
      );
      return false;
    }
  }

  async validateChain() {
    let errorLog = [];
    let blockHeight = await this.getBlockHeight();

    for (var i = 0; i <= blockHeight; i++) {
      const currentBlockInLoopObj = JSON.parse(await this.getBlock(i));

      let toValidate = await this.validateBlock(i);

      if (toValidate !== true) {
        errorLog.push(i);
      }

      if (i !== blockHeight) {
        const nextBlockInLoopObj = JSON.parse(await this.getBlock(i + 1));

        let blockHash = currentBlockInLoopObj.hash;

        let previousHash = nextBlockInLoopObj.previousBlockHash;

        if (blockHash !== previousHash) {
          errorLog.push(i);
        }
      } else {
        console.log('End of chain');
      }

      if (errorLog.length > 0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: ' + errorLog);
      } else {
        console.log('No errors detected');
      }
    }
  }
}

function addBlockTolevelDB(key, value) {
  return new Promise((resolve, reject) => {
    db.put(key, value, err => {
      if (err) {
        reject(err);
      }
      resolve(console.log('Great! Block', key, 'was added!', value));
    });
  }).then(() => value);
}

async function forceErrorlevelDB(key, blockBody, fakeHash) {
  const block = await getBlockDatalevelDB(key).then(value => {
    value = JSON.parse(value);
    if (fakeHash) {
      value.hash = fakeHash;
    }
    value.body = blockBody;
    return JSON.stringify(value);
  });

  return new Promise((resolve, reject) => {
    db.put(key, block, err => {
      if (err) {
        reject(err);
      }
      resolve(
        console.log(
          colors.yellow('Great! Block', key, 'was updated!', block, '\n')
        )
      );
    });
  });
}

function getBlockHeightlevelDB() {
  return new Promise((resolve, reject) => {
    let i = -1;

    db
      .createReadStream()
      .on('data', data => {
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

function getBlockByHashlevelDB(hash) {
  let block = null;
  return new Promise(function(resolve, reject) {
    //  self.db
    db
      .createReadStream()
      .on('data', function(data) {
        if (JSON.parse(data.value).hash === hash) {
          block = data.value;
        }
      })
      .on('error', function(err) {
        reject(err);
      })
      .on('close', function() {
        resolve(block);
      });
  });
}

function getBlockDatalevelDB(key) {
  return new Promise((resolve, reject) => {
    db.get(key, (err, value) => {
      if (err) {
        reject(err);
      }

      resolve(value);
    });
  });
}

function getBlocksByValueAttributelevelD(attribute) {
  return new Promise((resolve, reject) => {
    let addressesArr = [];
    db
      .createReadStream()
      .on('data', data => {
        data = JSON.parse(data.value);
        //console.log(data)
        if (data.address === attribute) {
          data.star.storyDecoded = hex2ascii(data.star.story);
          addressesArr.push(data);
        }
      })
      .on('error', error => {
        reject(err);
      })
      .on('close', () => {
        addressesArr.length > 1
          ? addressesArr
          : (addressesArr = addressesArr[0]);
        resolve(addressesArr);
      });
  });
}

/* Part of the previous Project (2) not part of this one

let blockchain = new Blockchain();

async function addTestBlocksLevelDB() {
  let ranBefore = await getBlockDatalevelDB(1);
  //console.log('ranBefore', ranBefore);
  if (!ranBefore) {
    for (var i = 0; i < 10; i++) {
      await blockchain.addBlock(new Block('Test block', i));
    }
  }
}
*/

/*
let blockchain = new Blockchain();

(function theLoop(i) {
  setTimeout(() => {
    blockchain.addBlock(new Block(`Test data ${i}`)).then(() => {
      if (--i) {
        theLoop(i);
      }
    });
  }, 100);
})(10);


setTimeout(() => {
  blockchain.validateChain().then(() => {
    console.log('*********************************************');
    console.log('Block 7');
    blockchain.validateBlock(7).then(value => console.log(value));
    blockchain.forceError(7, 'ERROR').then(value => {
      console.log(value);
      console.log('*********************************************');
      blockchain.validateBlock(7).then(() => {
        blockchain.validateChain();
      });
    });
  });
}, 2000);
*/

module.exports = Blockchain;
