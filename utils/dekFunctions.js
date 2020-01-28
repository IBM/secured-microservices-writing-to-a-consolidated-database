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


const request = require('request');
const fs = require('fs');
const tokenManager = require('./iam-token-manager.js')();
const ev = require('../env.js')().getEnv();
const logger = require('../log.js')('utils.dekFunctions');

module.exports = function () {
  let exports = {};

  exports.doGet = function(kpPath, msgStr, callback) {
    logger.info('doGet called');
  };

  exports.doPost = function(kpPath, formData, msgStr, callback) {
    logger.info(kpPath);
    logger.info(formData);
    logger.info(msgStr);
    tokenManager.getToken(ev.kpUrl, (err, token) => {
      logger.info(token);
      if (err) {
        logger.info('Error getting token for ' + ev.kpUrl + ' - ' + err, true);
        callback(401, {error: 'Error getting token for authenticating to:  ' + ev.kpUrl});
      } else {
        let options = exports._createRequest(token, 'POST', kpPath, formData);
        options.gzip = true;
        request(options, (err, resp, body) => {
          let errMsg = 'Error getting ' + msgStr + ' for ' + kpPath;
          if (err) {
            logger.info(err);
            if (err.code) {
              logger.info(errMsg + ' - ' + err + ' - ' + err.code, true);
            } else {
              logger.info(errMsg + ' - ' + err, true);
            }
            callback(500, {error: errMsg});
          } else {
            if (resp.statusCode >= 400) {
              if (body) {
                //logger.info(errMsg + ' >> ' + JSON.stringify(body), true);
                callback(resp.statusCode, {error: body});
              } else {
                logger.info(errMsg);
                callback(resp.statusCode, {error: errMsg});
              }
            } else {
              //limit log message to 90 characters
              logger.info(msgStr + ' for LPAR ' + kpPath + ' >> ' +
                JSON.stringify(body).toString().substring(0, 90));
              callback(null, body);
            }
          }
        });
      }
    });
  };

  /* unwraps a DEK and returns the base64 encoded value in result */
  exports.unwrapDEK = function(callback) {
    let dek = null;

    logger.info('unwrapDEK: ev.dek: ' + ev.dek);
    if (ev.dek == null) {
      callback(500, 'DEK does not exist');
    } else {

      let formData = {
        cipherText: ev.dek
      };

      exports.doPost(
        ev.kpUnwrapURI,
        JSON.stringify(formData),
        'unwrap key',
        (statusCode, result) => {
          logger.info('unwrapDEK: statusCode: ' + statusCode);
          if (statusCode != null) {
            logger.info(result);
            logger.info('unwrapDEK: msg: ' + result.error);
            let parsedResult = '';
            if (statusCode >= 500) {
              parsedResult = result.error;
            } else {
              parsedResult = JSON.parse(result.error).resources[0].errorMsg;
            }
            callback(statusCode, parsedResult);
          } else {
            logger.info('unwrapDEK result: ' + result);
            callback(statusCode, result);
          }
        }
      );
    }

  };

  /* removes the wrapped_sym.key file sets ev.dek to null */
  exports.deleteDEK= function(callback) {
    fs.unlink('wrapped_sym.key', (err) => {
      logger.info(err);
      if (err) {
        logger.error(err);
        callback('Error deleting DEK.');
      } else {
        ev.dek = null;
        callback(null);
      }
    });
  };

  exports._createRequest = function(token, httpMethod, path, formData) {
    let options = {
      url: path,
      /*rejectUnauthorized: false,
      requestCert: true,
      agent: false,
      json: true,
      */
      method: httpMethod,
      headers: {
        'Accept':'application/vnd.ibm.kms.key+json',
        'Authorization': 'Bearer ' + token,
        'bluemix-instance': ev.kpInstance
      },
      form: formData
    };
    logger.info('_createRequest options: ' + JSON.stringify(options, null, 2));
    return options;
  };

  return exports;
};
