/*!
 * Module dependencies.
 */
var Collection = require('./collection').Collection,
    Cursor = require('./cursor').Cursor,
    DbCommand = require('./commands/db_command').DbCommand,
    utils = require('./utils');

/**
 * Allows the user to access the admin functionality of MongoDB
 *
 * @class Represents the Admin methods of MongoDB.
 * @param {Object} db Current db instance we wish to perform Admin operations on.
 * @return {Function} Constructor for Admin type.
 */
function Admin(db) {
  if(!(this instanceof Admin)) return new Admin(db);

  /**
   * Retrieve the server information for the current
   * instance of the db client
   *
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from buildInfo or null if an error occured.
   * @return {null} Returns no result
   * @api public
   */
  this.buildInfo = function(callback) {
    this.serverInfo(callback);
  }

  /**
   * Retrieve the server information for the current
   * instance of the db client
   *
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from serverInfo or null if an error occured.
   * @return {null} Returns no result
   * @api private
   */
  this.serverInfo = function(callback) {
    db.executeDbAdminCommand({buildinfo:1}, function(err, doc) {
      if(err != null) return callback(err, null);
      return callback(null, doc.documents[0]);
    });
  }

  /**
   * Retrieve this db's server status.
   *
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from serverStatus or null if an error occured.
   * @return {null}
   * @api public
   */
  this.serverStatus = function(callback) {
    var self = this;

    db.executeDbAdminCommand({serverStatus: 1}, function(err, doc) {
      if(err == null && doc.documents[0].ok === 1) {
        callback(null, doc.documents[0]);
      } else {
        if(err) return callback(err, false);
        return callback(utils.toError(doc.documents[0]), false);
      }
    });
  };

  /**
   * Retrieve the current profiling Level for MongoDB
   *
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from profilingLevel or null if an error occured.
   * @return {null} Returns no result
   * @api public
   */
  this.profilingLevel = function(callback) {
    var self = this;

    db.executeDbAdminCommand({profile:-1}, function(err, doc) {
      doc = doc.documents[0];

      if(err == null && doc.ok === 1) {
        var was = doc.was;
        if(was == 0) return callback(null, "off");
        if(was == 1) return callback(null, "slow_only");
        if(was == 2) return callback(null, "all");
          return callback(new Error("Error: illegal profiling level value " + was), null);
      } else {
        err != null ? callback(err, null) : callback(new Error("Error with profile command"), null);
      }
    });
  };

  /**
   * Ping the MongoDB server and retrieve results
   *
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from ping or null if an error occured.
   * @return {null} Returns no result
   * @api public
   */
  this.ping = function(options, callback) {
    // Unpack calls
    var args = Array.prototype.slice.call(arguments, 0);
    db.executeDbAdminCommand({ping: 1}, args.pop());
  }

  /**
   * Authenticate against MongoDB
   *
   * @param {String} username The user name for the authentication.
   * @param {String} password The password for the authentication.
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from authenticate or null if an error occured.
   * @return {null} Returns no result
   * @api public
   */
  this.authenticate = function(username, password, callback) {
    db.authenticate(username, password, {authdb: 'admin'}, function(err, doc) {
      return callback(err, doc);
    })
  }

  /**
   * Logout current authenticated user
   *
   * @param {Object} [options] Optional parameters to the command.
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from logout or null if an error occured.
   * @return {null} Returns no result
   * @api public
   */
  this.logout = function(callback) {
    db.logout({authdb: 'admin'},  function(err, doc) {
      return callback(err, doc);
    })
  }

  /**
   * Add a user to the MongoDB server, if the user exists it will
   * overwrite the current password
   *
   * Options
   *  - **w**, {Number/String, > -1 || 'majority' || tag name} the write concern for the operation where < 1 is no acknowlegement of write and w >= 1, w = 'majority' or tag acknowledges the write
   *  - **wtimeout**, {Number, 0} set the timeout for waiting for write concern to finish (combines with w option)
   *  - **fsync**, (Boolean, default:false) write waits for fsync before returning, from MongoDB 2.6 on, fsync cannot be combined with journal
   *  - **j**, (Boolean, default:false) write waits for journal sync before returning
   *
   * @param {String} username The user name for the authentication.
   * @param {String} password The password for the authentication.
   * @param {Object} [options] additional options during update.
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from addUser or null if an error occured.
   * @return {null} Returns no result
   * @api public
   */
  this.addUser = function(username, password, options, callback) {
    var args = Array.prototype.slice.call(arguments, 2);
    callback = args.pop();
    options = args.length ? args.shift() : {};
    // Set the db name to admin
    options.dbName = 'admin';
    // Add user
    db.addUser(username, password, options, function(err, doc) {
      return callback(err, doc);
    })
  }
  /**
   * Remove a user from the MongoDB server
   *
   * Options
   *  - **w**, {Number/String, > -1 || 'majority' || tag name} the write concern for the operation where < 1 is no acknowlegement of write and w >= 1, w = 'majority' or tag acknowledges the write
   *  - **wtimeout**, {Number, 0} set the timeout for waiting for write concern to finish (combines with w option)
   *  - **fsync**, (Boolean, default:false) write waits for fsync before returning, from MongoDB 2.6 on, fsync cannot be combined with journal
   *  - **j**, (Boolean, default:false) write waits for journal sync before returning
   *
   * @param {String} username The user name for the authentication.
   * @param {Object} [options] additional options during update.
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from removeUser or null if an error occured.
   * @return {null} Returns no result
   * @api public
   */
  this.removeUser = function(username, options, callback) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);
    callback = args.pop();
    options = args.length ? args.shift() : {};
    options.dbName = 'admin';

    db.removeUser(username, options, function(err, doc) {
      return callback(err, doc);
    })
  }

  /**
   * Set the current profiling level of MongoDB
   *
   * @param {String} level The new profiling level (off, slow_only, all)
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from setProfilingLevel or null if an error occured.
   * @return {null} Returns no result
   * @api public
   */
  this.setProfilingLevel = function(level, callback) {
    var self = this;
    var command = {};
    var profile = 0;

    if(level == "off") {
      profile = 0;
    } else if(level == "slow_only") {
      profile = 1;
    } else if(level == "all") {
      profile = 2;
    } else {
      return callback(new Error("Error: illegal profiling level value " + level));
    }

    // Set up the profile number
    command['profile'] = profile;

    db.executeDbAdminCommand(command, function(err, doc) {
      doc = doc.documents[0];

      if(err == null && doc.ok === 1)
        return callback(null, level);
      return err != null ? callback(err, null) : callback(new Error("Error with profile command"), null);
    });
  };

  /**
   * Retrive the current profiling information for MongoDB
   *
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from profilingInfo or null if an error occured.
   * @return {null} Returns no result
   * @api public
   */
  this.profilingInfo = function(callback) {
    try {
      new Cursor(db, new Collection(db, DbCommand.SYSTEM_PROFILE_COLLECTION), {}, {}, {dbName: 'admin'}).toArray(function(err, items) {
          return callback(err, items);
      });
    } catch (err) {
      return callback(err, null);
    }
  };

  /**
   * Execute a db command against the Admin database
   *
   * @param {Object} command A command object `{ping:1}`.
   * @param {Object} [options] Optional parameters to the command.
   * @param {Function} callback this will be called after executing this method. The command always return the whole result of the command as the second parameter.
   * @return {null} Returns no result
   * @api public
   */
  this.command = function(command, options, callback) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);
    callback = args.pop();
    options = args.length ? args.shift() : {};

    // Execute a command
    db.executeDbAdminCommand(command, options, function(err, doc) {
      // Ensure change before event loop executes
      return callback != null ? callback(err, doc) : null;
    });
  }

  /**
   * Validate an existing collection
   *
   * @param {String} collectionName The name of the collection to validate.
   * @param {Object} [options] Optional parameters to the command.
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from validateCollection or null if an error occured.
   * @return {null} Returns no result
   * @api public
   */
  this.validateCollection = function(collectionName, options, callback) {
    var args = Array.prototype.slice.call(arguments, 1);
    callback = args.pop();
    options = args.length ? args.shift() : {};

    var self = this;
    var command = {validate: collectionName};
    var keys = Object.keys(options);

    // Decorate command with extra options
    for(var i = 0; i < keys.length; i++) {
      if(options.hasOwnProperty(keys[i])) {
        command[keys[i]] = options[keys[i]];
      }
    }

    db.command(command, function(err, doc) {
      if(err != null) return callback(err, null);

      if(doc.ok === 0)
        return callback(new Error("Error with validate command"), null);
      if(doc.result != null && doc.result.constructor != String)
        return callback(new Error("Error with validation data"), null);
      if(doc.result != null && doc.result.match(/exception|corrupt/) != null)
        return callback(new Error("Error: invalid collection " + collectionName), null);
      if(doc.valid != null && !doc.valid)
        return callback(new Error("Error: invalid collection " + collectionName), null);

      return callback(null, doc);
    });
  };

  /**
   * List the available databases
   *
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from listDatabases or null if an error occured.
   * @return {null} Returns no result
   * @api public
   */
  this.listDatabases = function(callback) {
    // Execute the listAllDatabases command
    db.executeDbAdminCommand({listDatabases:1}, {}, function(err, doc) {
      if(err != null) return callback(err, null);
      return callback(null, doc.documents[0]);
    });
  }

  /**
   * Get ReplicaSet status
   *
   * @param {Function} callback this will be called after executing this method. The first parameter will contain the Error object if an error occured, or null otherwise. While the second parameter will contain the results from replSetGetStatus or null if an error occured.
   * @return {null}
   * @api public
   */
  this.replSetGetStatus = function(callback) {
    var self = this;

    db.executeDbAdminCommand({replSetGetStatus:1}, function(err, doc) {
      if(err == null && doc.documents[0].ok === 1)
        return callback(null, doc.documents[0]);
      if(err) return callback(err, false);
      return callback(utils.toError(doc.documents[0]), false);
    });
  };
};

/**
 * @ignore
 */
exports.Admin = Admin;
