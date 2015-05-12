// Angular module, defining routes for the app
var wallboard = angular.module('wallboard', ['wallboardServices','gridster','ui.bootstrap','colorpicker.module','cgNotify','ui-iconpicker','ngAnimate','angular-inview']).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.
			when('/home', { templateUrl: 'partials/home.html', controller: 'HomeCtrl' }).
			when('/boards', { templateUrl: 'partials/boards_list.html', controller: 'BoardListCtrl' }).
			when('/board/:boardId', { templateUrl: 'partials/board.html', controller: 'BoardItemCtrl' }).
			when('/newBoard', { templateUrl: 'partials/newBoard.html', controller: 'BoardNewCtrl' }).
			when('/help', { templateUrl: 'partials/help.html'} ).
			//when('/widget_selector', { templateUrl: 'partials/widget_selector.html', controller: WidgetSelectorCtrl }).
			// If invalid route, just redirect to the main list view
			otherwise({ redirectTo: '/home' });
	}])
    .filter('math_sin', function() {
        return function(input) {
            return Math.sin(input);
        };
    })
    .filter('math_cos', function() {
        return function(input) {
            return Math.cos(input);
        };
    })
    .config(['$logProvider', function($logProvider) {
        $logProvider.debugEnabled(false);
    }])
    .provider('logEnhancer', function() {
        this.loggingPattern = '%s - %s: ';
        
        this.$get = function() {
            var loggingPattern = this.loggingPattern;
            return {
                enhanceAngularLog : function($log) {
                    $log.enabledContexts = [];
      
                    $log.getInstance = function(context) {
                        return {
                            log : enhanceLogging($log.log, context, loggingPattern),
                            info    : enhanceLogging($log.info, context, loggingPattern),
                            warn    : enhanceLogging($log.warn, context, loggingPattern),
                            debug   : enhanceLogging($log.debug, context, loggingPattern),
                            error   : enhanceLogging($log.error, context, loggingPattern),
                            enableLogging : function(enable) {
                                $log.enabledContexts[context] = enable;
                            }
                        };
                    };
      
                    function enhanceLogging(loggingFunc, context, loggingPattern) {
                        return function() {
                            var contextEnabled = $log.enabledContexts[context];
                            if (contextEnabled) {
                                var modifiedArguments = [].slice.call(arguments);
                                var now = new Date();
                                modifiedArguments[0] = [ now.toLocaleString() + " - "+ context + ": "] + modifiedArguments[0];
                                loggingFunc.apply(null, modifiedArguments);
                            }
                        };
                    }
                }
            };
        };
    }).config(['logEnhancerProvider', function(logEnhancerProvider) {
        logEnhancerProvider.loggingPattern = '%s::[%s]> ';
    }]).run(['$log', 'logEnhancer', function($log, logEnhancer) {
        logEnhancer.enhanceAngularLog($log);
    }]).directive('v_headline', [function() {

        function obj(scope, element, attrs) {
          var numberOfItem;

          function updateTime() {
            element.text(dateFilter(new Date(), 'M/d/yy h:mm:ss'));
          }
          function updateTimehaho() {
              element.text("valtozott");
              scope.widthxx = "red" ;
              console.log(scope.widthxx);
            }
          scope.$watch(attrs.myCurrentTime, function(value) {
            console.log(value);
            updateTimehaho();
          });

          element.on('$destroy', function() {
            $interval.cancel(timeoutId);
          });

          // start the UI update process; save the timeoutId for canceling
          timeoutId = $interval(function() {
            updateTime(); // update DOM
          }, 1000);
        }

        return {
          link: link
        };
      }]).directive('currenttime', ['$interval', 'dateFilter', function($interval, dateFilter) {

          function link(scope, element, attrs) {
            var format, timeoutId;

            function updateTime() {
              element.text(dateFilter(new Date(), format));
            }

            scope.$watch(attrs.currenttime, function(value) {
              format = value;
              updateTime();
            });

            element.on('$destroy', function() {
              $interval.cancel(timeoutId);
            });

            // start the UI update process; save the timeoutId for canceling
            timeoutId = $interval(function() {
              updateTime(); // update DOM
            }, 1000);
          }

          return {
            link: link
          };
        }]);
