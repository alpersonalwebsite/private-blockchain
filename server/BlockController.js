const SHA256 = require('crypto-js/sha256');

const Block = require('../bc/Block.js');
const Blockchain = require('../bc/simpleChain');
let blockchain = new Blockchain();

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {
  /**
     * Constructor to create a new BlockController, you need to initialize
     here all your endpoints
     * @param {*} app
     */
  constructor(app) {
    this.app = app;
    this.blocks = [];
    this.getBlockByIndex();
    this.postNewBlock();
    this.otherRoutes();
  }

  /**
     * Implement a GET Endpoint to retrieve a block by index,
      url: "/api/block/:index"
     */
  getBlockByIndex() {
    this.app.get('/block/:index', async (req, res) => {
      try {
        const getBlockViaWS = await blockchain.getBlock(req.params.index);
        console.log(getBlockViaWS);
        res.send(JSON.parse(getBlockViaWS));
      } catch (err) {
        res.status(404);
        res.send({
          error: 404,
          errorMsg: 'I do not have that block...!'
        });
      }
    });
  }

  /**
   * Implement a POST Endpoint to add a new Block, url: "/api/block"
   */
  postNewBlock() {
    this.app.post('/block', async (req, res) => {
      if (!req.body.body) {
        res.status(400);
        res.send({
          error: 400,
          errorMsg: 'I need a body...!'
        });
        return;
      }
      try {
        await blockchain
          .addBlock(req.body)
          .then(value => res.send(JSON.parse(value)));
      } catch (err) {
        res.send({
          error: 400,
          errorMsg: 'I was not able to add that block...!'
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
        error: 404,
        errorMsg: 'I just allow 2 routes. Please, check the README.md'
      });
    }
  }
}

module.exports = app => {
  return new BlockController(app);
};