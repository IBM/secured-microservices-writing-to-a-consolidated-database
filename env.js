// Copyright 2020 IBM Corp. All Rights Reserved.

// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You
// may obtain a copy of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.


require('dotenv').config();
const async = require('async');
const fs = require('fs');
const logger = require('./log.js')('env');
const ev = {};

module.exports = function() {

  const exports = {};

  exports.createEnv = function(callback) {
    ev.cmIamApiKey =  process.env.IBM_API_KEY;
    ev.iamPath = process.env.IAM_PATH;
    ev.mongoUser = process.env.MONGO_USER;
    ev.mongoPass = process.env.MONGO_PASS;
    ev.dek = null;
    ev.kpRootKeyId = process.env.ROOT_KEY_ID;
    ev.kpUrl = process.env.KP_URL;
    ev.kpPath = ev.kpUrl + process.env.KP_PATH;
    ev.kpInstance = process.env.KP_INSTANCE;
    ev.kpWrapURI = ev.kpPath + '/' + ev.kpRootKeyId + '?action=wrap';
    ev.kpUnwrapURI = ev.kpPath + '/' + ev.kpRootKeyId + '?action=unwrap';
    ev.kpTokens = {};
    ev.mongoDBUrl =
      'mongodb://' +
      ev.mongoUser + ':' + ev.mongoPass + '@' + process.env.MONGO_ENDPOINTS + '/' + process.env.MONGO_DB_NAME + '?replicaSet=' + process.env.MONGO_CLUSTER_NAME + '&ssl=true';

    async.series([
      function(cb) {
        let filename = 'wrapped_sym.key';
        if (fs.existsSync(filename)) {
          fs.open(filename, 'r', (err, fh) => {
            fs.readFile(fh, 'utf-8', (err, contents) => {
              if (!err) {
                ev.dek = contents;
              } else {
                logger.error(err);
              }
            });
          });
        }
        cb(null);
      },
      function (cb) {
        // connect to key protect?

      },
      function (cb) {
        // connect to mongo?
      }
    ], function (error, results) {
      if (error) {
        callback(error, results);
      }
      callback(error, ev);
    });
  };

  exports.getEnv = function() {
    return ev;
  };

  return exports;
};
