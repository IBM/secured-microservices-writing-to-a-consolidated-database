// Copyright 2018 IBM Corp. All Rights Reserved.

// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You
// may obtain a copy of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.


/* eslint-disable curly */
const shelljs = require('shelljs');
let express = require('express');
let router = express.Router();
const fs = require('fs');
const dekFunctions = require('../utils/dekFunctions.js')();
const tokenManager = require('../utils/iam-token-manager.js')();
const ev = require('../env.js')().getEnv();
const logger = require('../log.js')('dekAdmin');

/* GET DEK management page. */
router.get('/', function(req, res, next) {
  let dekExists = false;
  logger.info('ev.dek: '+ ev.dek);
  if (ev.dek !== null) {
    dekExists = true;
    res.render('dekAdmin', {dekExists: dekExists, errorMsg: 'Already logged in as Accounting team'});
  } else {
    res.render('dekAdmin', {dekExists: dekExists});
  }
});

/* Route to handle generation or deletion of DEK */
router.post('/', function(req, res, next) {
  if (req.body.action === 'delete') {
    dekFunctions.deleteDEK((err) => {
      logger.info('deleteDEK: ' + err);
      if (err) {
        res.render('dekAdmin', {dekExists: true, errorMsg: err});
      } else {
        logger.info('delete success');
        ev.dek = null;
        res.render('dekAdmin', {dekExists: false, successMsg: 'Successfully removed team and DEK.'});
      }
    });
  } else {
    /*
    dekFunctions.generateDEK((err) => {
      if (!err) {
        res.render('dekAdmin', {
          dek: ev.dek,
          successMsg: 'Successfully generated a DEK.'
        });
      } else {
        res.render('dekAdmin', {errorMsg: err});
      }
    });
    */
    let error = '';
    let respBody = '';

    logger.info('ev.dek: ' + ev.dek);
    if (!fs.exists('wrapped_sym.key') || ev.dek == null) {
      // Generate a Data Encryption Key (DEK)
      shelljs.exec('openssl rand -base64 256 > sym_keyfile.key', (code, stdout, stderr) => {
        console.log(code);

        if (code > 0) {
          console.log(stderr);
          error = stderr;
        } else {
          // Call the Key Protect wrap function on the DEK to secure the key
          // Tuck this key away to be used
          let keyfile = 'sym_keyfile.key';
          fs.readFile(keyfile, 'utf-8', (err, contents) => {
            if (!err) {
              // Make a POST request to wrap the DEK
              console.log('getToken: calling kpUrl: ' + ev.kpUrl);
              let buff = new Buffer(contents);
              logger.info('utf-8:' + buff);
              //let base64Data = buff.toString('base64');
              //logger.info(base64Data);
              let formData = {
                plainText: contents
              };
              logger.info('base64: ' + formData);

              // TODO: Tuck away the root key id after doing a GET to retrieve it - move that to app startup

              dekFunctions.doPost(ev.kpWrapURI, JSON.stringify(formData), 'wrapped key', (statusCode, msg) => {
                if (statusCode != null) {
                  error = msg.error;
                  logger.info('rendering with error: ' + error);
                  res.render('dekAdmin', {errorMsg: error});
                } else {
                  respBody = msg;
                  let respObj = JSON.parse(msg);
                  ev.dek = respObj.ciphertext;
                  fs.writeFile('wrapped_sym.key', respObj.ciphertext, (err) => {
                    if (err) {
                      logger.error(err);
                      res.render('dekAdmin', {errorMsg: err});
                    } else {
                      if (!err) {
                        fs.unlink(keyfile, (err) => {
                          if (err) {
                            logger.error(err);
                          }
                        });
                      }

                      logger.info('rendering success or init: ' + respBody);
                      res.render('dekAdmin', {
                        dekExists: true,
                        dek: ev.dek,
                        successMsg: 'Successfully generated a team and DEK.'
                      });
                    }
                  });
                }
              });
            } else {
              throw err;
            }
          });
        }
      });
    } else {
      res.render('dekAdmin', {
        dekExists: true,
        errorMsg: 'A DEK has already been generated!'
      });
    }
  }
});

module.exports = router;
