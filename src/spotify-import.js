// See https://timonweb.com/tutorials/how-to-enable-ecmascript-6-imports-in-nodejs/ for why this file is here.

require = require("esm")(module /*, options*/);
module.exports = require("./main.js");
