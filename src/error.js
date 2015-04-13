'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

let util = require('util');


// ------------------------------------------------------------
// Errors
// ------------------------------------------------------------

function NotFoundError(message) {
  this.message = message || 'Not Found';
  this.name = this.constructor.name;
};
util.inherits(NotFoundError, Error);

function AuthorizationError(message) {
  this.message = message || 'Unauthorized';
  this.name = this.constructor.name;
};
util.inherits(AuthorizationError, Error);

function MissingParameterError(message) {
  this.message = message || 'Required parameter is missing';
  this.name = this.constructor.name;
}


// ------------------------------------------------------------
// Methods
// ------------------------------------------------------------

function toHttpData(err) {
  let statusCode, message;

  switch (err.name) {
    case 'SyntaxError':
      statusCode = 400;
      message = 'invalid data';
      break;
    case 'ValidationError':
      statusCode = 400;
      message = 'invalid data';
      break;
    case 'MissingParameterError':
      statusCode = 400;
      message = 'invalid parameters';
      break;
    case 'AuthorizationError':
      statusCode = 401;
      message = 'access token required';
      break;
    case 'NotFoundError':
      statusCode = 404;
      message = 'not found';
      break;
    case 'MongoError':
      if (err.code === 11000) {
        // duplicate key error
        statusCode = 409;
        message = 'some parts or all of data you sent ' +
          'conflict with stored data';
        break;
      }
    default:
      statusCode = 500;
      message = 'interanal error';
  }

  return {
    statusCode: statusCode,
    message: message,
  };
}


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = {
  toHttpData: toHttpData,
  NotFoundError: NotFoundError,
  AuthorizationError: AuthorizationError,
  MissingParameterError: MissingParameterError,
};
