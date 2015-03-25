(function(global) {
  'use strict';

  // ------------------------------------------------------------
  // Modules
  // ------------------------------------------------------------

  var util = require('util');


  // ------------------------------------------------------------
  // Errors
  // ------------------------------------------------------------

  var NotFoundError = function NotFoundError(message) {
    this.message = message || 'Not Found';
    this.name = this.constructor.name;
    this.statusCode = 404;
  };
  util.inherits(NotFoundError, Error);

  var AuthorizationError = function AuthorizationError(message) {
    this.message = message || 'Unauthorized';
    this.name = this.constructor.name;
    this.statusCode = 401;
  };
  util.inherits(AuthorizationError, Error);

  
  // ------------------------------------------------------------
  // Export
  // ------------------------------------------------------------

  module.exports = {
    NotFoundError: NotFoundError,
    AuthorizationError: AuthorizationError
  };

})((this || 0).self || global);
