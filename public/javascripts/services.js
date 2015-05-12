angular.module('wallboardServices', ['ngResource','ngRoute']).
    factory('Board', ['$resource', function($resource) {
        return $resource('boards/:boardId', {}, {
		    query: {method: 'GET', params: {boardId: 'boards'}, isArray:true}
	    });
    }]).
    factory('socket', ['$rootScope', function($rootScope) {
        var socket = io.connect('',{
            'reconnect': true,
            'reconnection delay': 500,
            'max_reconnection attempts': Infinity,
            //The maximum reconnection delay in milliseconds, or Infinity.
            'reconnection limit': 5000,
            'secure': true
        });
        var manager = socket.io;
        manager.on("reconnect_attempt", function () {
                 } );
        return {
            on: function (eventName, callback) {
                socket.on(eventName, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                socket.emit(eventName, data, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            },
            removeAllListeners: function () {
                socket.removeAllListeners();
            },
            isConnected: function() {
                return socket.connected;
            }
        };
    }]).
    factory('debounce', ['$timeout','$q', function($timeout, $q) {
        // The service is actually this function, which we call with the func
        // that should be debounced and how long to wait in between calls
        return function debounce(func, wait, immediate) {
            var timeout;
            // Create a deferred object that will be resolved when we need to
            // actually call the func
            var deferred = $q.defer();
            return function() {
                var context = this, args = arguments;
                var later = function() {
                    timeout = null;
                    if(!immediate) {
                        deferred.resolve(func.apply(context, args));
                        deferred = $q.defer();
                    }
                };
                var callNow = immediate && !timeout;
                if ( timeout ) {
                    $timeout.cancel(timeout);
                }
                timeout = $timeout(later, wait);
                if (callNow) {
                    deferred.resolve(func.apply(context,args));
                    deferred = $q.defer();
                }
                return deferred.promise;
            };
        };
    }]);