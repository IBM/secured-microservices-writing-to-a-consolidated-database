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


const util = require('util');
const {config, createLogger, format, transports} = require('winston');
const {combine, timestamp, printf} = format;

const _buildMessage = function(packageName, args) {
  let s = '';
  for (let i=0; i<args.length; i++) {
    if (typeof args[i] === 'string') {
      s = s.concat(' ' + args[i]);
    } else {
      s = s.concat(' ' + util.inspect(args[i]));
    }
  }
  return {
    package: packageName,
    message: s
  };
};

module.exports = function(name) {
  const exports = {};

  exports._packageName = name;

  exports._logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: config.npm.levels,
    format: combine(
      format.align(),
      timestamp(),
      printf(info =>
        `${info.timestamp} [${info.package}] ${info.level}: ${info.message}`)
    ),
    transports: [
      new transports.Console()
    ]
  });

  exports.error = function() {
    this._logger.error(_buildMessage(this._packageName, arguments));
  };

  exports.warn = function() {
    this._logger.warn(_buildMessage(this._packageName, arguments));
  };

  exports.info = function() {
    this._logger.info(_buildMessage(this._packageName, arguments));
  };

  exports.verbose = function() {
    this._logger.verbose(_buildMessage(this._packageName, arguments));
  };

  exports.debug = function() {
    this._logger.debug(_buildMessage(this._packageName, arguments));
  };

  exports.silly = function() {
    this._logger.silly(_buildMessage(this._packageName, arguments));
  };

  exports.write = function(message) {
    this._logger.info(_buildMessage(this._packageName, message.trim()));
  };

  return exports;
};

