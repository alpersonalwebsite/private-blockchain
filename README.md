# Project 3: RESTful Web API with Node.js Framework

[![Greenkeeper badge](https://badges.greenkeeper.io/alpersonalwebsite/private-blockchain.svg)](https://greenkeeper.io/)

### Prerequisites

You need to have [Node.js](https://nodejs.org/en/download/) installed.

---

### Installing and running

In your CMD or terminal execute (inside the root dir: **project/**)

```
npm start
```

This will install the following dependencies

For the main project, **project/package.json**

* colors
* crypto-js
* hex2ascii
* lodash
* moment
* npm-run-all
* nodemon

For the blockchain project, **project/bc/package.json** and for the star module project (as well) **project/star/package.json**

* level

For express project, **/project/server/package.json**

* bitcoinjs-message
* body-parser
* express

... in the proper folders and sub-folders.

It will also execute the necessary scripts and serve on http://localhost:8000

**Please, be patient.** The processes could take some time.

This project uses Express: https://expressjs.com/

---

Note: You will see prints in the console (for disclaimed actions). Their purpose is merely illustrative and a helpful way to collaborate with the reviewer. This would not be included in a production environment.

---

### API endpoints

#### General (or common) error handling

Other routes outside the consigned endpoints will return 404 (status code) with the following message:

```
{
    "error": "I have limited routes. Please, check the README.md"
}
```

Also, any invalid JSON request body will return 400 (status code) with the message:

```
{
    "error": "Invalid JSON request body!"
}
```

#### Cleaner function on init and every 5 minutes:

Every time we start the servers, if we have stored expired and unsigned ("messageSignature": false) `validation requests`, our "cleaner" function will delete them programmatically. This should not affect properly signed requests.
This script will run every 5 minutes performing the same logic.

In the console you will see:

```
[-] Request with key: 1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x was deleted! [Expired: 4 minutes ago ]
```

#### User submits a validation request

* Endpoint: http://localhost:8000/requestValidation
* Method: POST
* Required parameters: address

Example:

```
{
    "address": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x"
}
```

Response:

```
{
    "address": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x",
    "timestamp": 1542403637,
    "expiringUnix": 1542403937,
    "messageSignature": false,
    "message": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x:1542403637:starRegistry",
    "validationWindow": 300
}
```

_Update 11/21:_ By reviewer request, I´m excluding the following property from the JSON response: `expiringUnix`. Also, `timestamp` now is `requestTimeStamp`.

In the console you will see:

```
[+] Great! Request 1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x was added! {"address":"1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x","timestamp":1542404529,"expiringUnix":1542404829,"messageSignature":false,"message":"1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x:1542404529:starRegistry"}
```

If you try to make a new "validation request" using this wallet you will receive the same response, but, with the property `remainingTime` indicating in human-readable format how much time do you still have to `sign` your request.

Example:

```
{
    "address": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x",
    "timestamp": 1542403637,
    "expiringUnix": 1542403937,
    "messageSignature": false,
    "message": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x:1542403637:starRegistry",
    "validationWindow": 210,
    "remainingTime": "You still have time. Your request will expire in 3 minutes (aprox)"
}
```

_Update 11/21:_ By reviewer request, I´m excluding the following properties from the JSON response: `expiringUnix` and `remainingTime`. Also, `timestamp` now is `requestTimeStamp`.

In the console you will see:

```
[!] I have this request {"address":"1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x","timesta                mp":1542404529,"expiringUnix":1542404829,"messageSignature":false,"message":"1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x:1542404529:starRegistry"} and it is still valid!
```

However, if the time (5 min) expired, the response will be:

```
{
    "msg": "Your time for validating the request expired!"
}
```

And, in the console you will see:

```
[X] The time for validating this request expired!
```

##### Particular error handling

If you don't include the `address` property in your request body you will receive the following error:

```
{
    "error": "I need a Wallet...!"
}
```

#### User signs and validates request

* Endpoint: http://localhost:8000/message-signature/validate
* Method: POST
* Required parameters: address, signature

Example:

```
{
    "address": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x",
    "signature": "IIpGJUlcuAHI5jH9CANKOaVZK2U/f2JyAYwRkCqiE/7uPnJG/5ZSjNqG8+rNSbobIqHvwOScHBY9hoDpVfB3TDk="
}
```

Response:

```
{
    "address": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x",
    "timestamp": 1542403637,
    "expiringUnix": 1542403937,
    "messageSignature": true,
    "message": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x:1542403637:starRegistry"
}
```

_Update 11/21:_ By reviewer request, I´m excluding the following property from the JSON response: `expiringUnix`. Also, `timestamp` now is `requestTimeStamp`.

We retrieve the entire object, however, the important property is `messageSignature` which now has true as value: `"messageSignature": true`

In the console you will see:

```
[$] Your signed request was validated!
```

We no longer display `validationWindow` and `remainingTime` since now the request is "valid".

Note: User generates the signature using his address (wallet) and the message (`"message": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x:1542411577:starRegistry"`) provided in the step before as response
![Electrum: Sign](/images/electrum-sign.png)

If you try to re-validate the request (repeat this process with the same information), you will receive the following response:

```
{
    "message": "Request validated previously!"
}
```

##### Particular error handling

If you don't include the `address` AND `signature` properties in your request body you will receive either one of these errors:

For none:

```
{
    "error": "Missing parameters: address, signature"
}
```

For missing address:

```
{
    "error": "Missing parameter: address"
}
```

For missing signature:

```
{
    "error": "Missing parameter: signature"
}
```

#### User sends star data to be stored

* Endpoint: http://localhost:8000/block
* Method: POST
* Required parameters: address, star object (and properties)

Example:

```
{
  "address": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x",
  "star": {
    "dec": "68° 52' 56.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }
}
```

Response:

```
{
    "address": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x",
    "star": {
        "dec": "68° 52' 56.9",
        "ra": "16h 29m 1.0s",
        "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
        "storyDecoded": "Found star using https://www.google.com/sky/"
    },
    "height": 3,
    "time": "1542423290",
    "previousBlockHash": "5b8e9b8fd576709159cd2a730cdf61c90531f162f614d16567322bb846e39296",
    "hash": "d5c9e7173d60b3bd54c6dafc6265beb07e083fc2af1cf223aa9f36aa7b786f07"
}
```

Important: After the star is added the `request to add a star is DELETED`. So, if the user tries to add the same or other star after adding one (using his validated request), he will receive the following error:

```
{
    "error": "I don´t have that wallet or address!"
}
```

User can start the process again: http://localhost:8000/requestValidation

##### Particular error handling

If the address or wallet is not found in the DB, response:

```
{
    "error": "I don´t have that wallet or address!"
}
```

If there is no address (wallet) in the request body, response:

```
{
    "error": "I need a Wallet...!"
}
```

If the user did not sign the request, response:

```
{
    "error": "You need to validate your request...!"
}
```

If there is no star property, response:

```
{
    "error": "I need a Star property...!"
}
```

If one, some or all properties of star property are missing, response:

* Missing all: `"error": "Missing parameters: dec, ra, story"`
* Missing dec and ra: `"error": "Missing parameters: dec, ra"`
* Missing story: `"error": "Missing parameters: story"`

If the star story property contains non-ASCII chars, response:

```
{
    "error": "We only accept ASCII characters...!"
}
```

If the star story property is bigger than 500 bytes, response:

```
{
    "error": "Star story should be less than 500 bytes"
}
```

#### GET: /block/blockHeight

* Endpoint: http://localhost:8000/block/blockHeight
* Method: GET
* Required parameter: blockHeight

Example: http://localhost:8000/block/1

Response:

```
{
    "address": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x",
    "star": {
        "dec": "68° 52' 56.9",
        "ra": "16h 29m 1.0s",
        "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
        "storyDecoded": "Found star using https://www.google.com/sky/"
    },
    "height": 1,
    "time": "1542589825",
    "previousBlockHash": "a4a40b1b203432728b9c98647ee2d2d26d02c435abad3f24eb914a087792c25c",
    "hash": "e95e75cdfb685f017445aea101d7aab64b650bb0ea1351d3ddae43c8a6dd593c"
}
```

Note: The Genesis Block or Block 0 will be always present as soon as the class is instantiated.

##### Particular error handling

For non-existent block, response:

```
{
    "error": "I don´t have that block!"
}
```

#### GET: /stars/hash:hash

* Endpoint: http://localhost:8000/stars/hash:hash
* Method: GET
* Required parameter: hash

Example: http://localhost:8000/stars/hash:e95e75cdfb685f017445aea101d7aab64b650bb0ea1351d3ddae43c8a6dd593c

Response:

```
{
    "address": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x",
    "star": {
        "dec": "68° 52' 56.9",
        "ra": "16h 29m 1.0s",
        "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
        "storyDecoded": "Found star using https://www.google.com/sky/"
    },
    "height": 1,
    "time": "1542589825",
    "previousBlockHash": "a4a40b1b203432728b9c98647ee2d2d26d02c435abad3f24eb914a087792c25c",
    "hash": "e95e75cdfb685f017445aea101d7aab64b650bb0ea1351d3ddae43c8a6dd593c"
}
```

##### Particular error handling

For non-existent hashes, response:

```
{
    "error": "I don´t have a block with that hash!"
}
```

#### GET: /stars/address:address

* Endpoint: http://localhost:8000/stars/address:address
* Method: GET
* Required parameter: adddress

Example: http://localhost:8000/stars/address:1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x

Response for one occurrence of x-address: {}

```
{
    "address": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x",
    "star": {
        "dec": "68° 52' 56.9",
        "ra": "16h 29m 1.0s",
        "story": "544553542031202d20466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
        "storyDecoded": "TEST 1 - Found star using https://www.google.com/sky/"
    },
    "height": 1,
    "time": "1542596792",
    "previousBlockHash": "3e598516b6729640714c4e8c88b05d0cc7cd5853cd49c1d0a7dee9748605120e",
    "hash": "5310fbf16fe13a4a33b2993a7eb87bc775890b99e3fd8fd323462da668689c64"
}
```

Response for multiple occurrences of x-address: []

```
[
    {
        "address": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x",
        "star": {
            "dec": "68° 52' 56.9",
            "ra": "16h 29m 1.0s",
            "story": "544553542031202d20466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "TEST 1 - Found star using https://www.google.com/sky/"
        },
        "height": 1,
        "time": "1542594572",
        "previousBlockHash": "42a86158e360099c856a81741277e74aa4ae6272be0ea1419230d4cf3821ec03",
        "hash": "9facf7493033f2865b9411248999fb06b8f2d11706d2859d6b8d1dfd5655c6d4"
    },
    {
        "address": "1Ga3deG1qKsxKfSg9xWfa4Y8cLcxCMQM6x",
        "star": {
            "dec": "68° 52' 56.9",
            "ra": "16h 29m 1.0s",
            "story": "544553542032202d20466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "TEST 2 - Found star using https://www.google.com/sky/"
        },
        "height": 2,
        "time": "1542596049",
        "previousBlockHash": "9facf7493033f2865b9411248999fb06b8f2d11706d2859d6b8d1dfd5655c6d4",
        "hash": "d7796f1af2dfcd75139ee33cb3255dd5633b6c88d43610154d9e2e5226da132b"
    }
]
```

##### Particular error handling

For non-existent addresses, response:

```
{
    "error": "I don´t have that address!"
}
```

### Credits

Function for checking is all chars are ASCII

```
exports.isASCII = function (str) {
    return /^[\x00-\x7F]*$/.test(str);
}
```

Credits zzzzBov - https://stackoverflow.com/questions/14313183/javascript-regex-how-do-i-check-if-the-string-is-ascii-only
