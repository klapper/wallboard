// Controller for the board list
wallboard.controller('BoardListCtrl', ['$scope','Board', function($scope, Board) {
	$scope.boards = Board.query();
}]);

//Controller for the board list
wallboard.controller('HomeCtrl', ['$scope', 'Board', function($scope, Board) {
    $scope.new_board_state='initial';
    $scope.boards = Board.query();
    $scope.selected = 'public';
    $scope.new_board = {
            name: '',
            creator_name: '',
            elements: []
        };
    // Validate and save the new board to the database
    $scope.createBoard = function() {
        $scope.new_board_state='saving';
        var new_board = new Board($scope.new_board);
        // Call API to save board to the database
        new_board.$save(function(p, resp) {
            if(!p.error) {
                // If there is no error, redirect to the main view
                $scope.new_board_state='saved';
                $scope.new_board_id=p._id;
            } else {
                $scope.new_board_last_error=p.error;
                $scope.new_board_state='initial';
            }
        }, function(data) {
            $scope.new_board_last_error="nemtom";
            $scope.new_board_state='initial';
        }
        );
    };
}]);

//Controller for the board list
wallboard.controller('NewBoardCtrl', ['$scope', 'Board', function($scope, Board) {
    $scope.new_board = {
            name: '',
            creator_name: '',
            elements: []
        };
        
    // Validate and save the new board to the database
    $scope.createBoard = function() {
        $scope.saving = true;
        var new_board = new Board($scope.new_board);
        // Call API to save board to the database
        new_board.$save(function(p, resp) {
            if(!p.error) {
                // If there is no error, redirect to the main view
                $scope.saved = true;
                $scope.saving = false;
            } else {
                $scope.saved = false;
                $scope.saving = false;
            }
        });
    };
}]);



// Controller for an individual board
wallboard.controller('BoardItemCtrl', ['$scope','$routeParams','$modal', 'socket', 'Board', 'debounce', 'notify', '$log', function($scope, $routeParams, $modal, socket, Board, debounce, notify, $log) {
    var logger = $log.getInstance('wallboard');
    $scope.logger = logger;
	//$scope.board = Board.get({boardId: $routeParams.boardId});
    notify("Press F11 to go full screen");
    //notify({message:"Press F11 to go full screen", template:'partials/notify-template.html'});
    logger.info("BoardItemCtrl loading...");
    $scope.loading=true;
    $scope.scrollbar=false;
    $scope.board_id = $routeParams.boardId;
	$scope.elements = [];
	
	$scope.clear_interests = function() {
        logger.debug("Socket - sending: clear interest...");
        socket.emit('clear_interest',{});
	};
	$scope.send_interests = function() {
        if (!$scope.loading) {
            var my_interest = {};
            my_interest.elements = $scope.elements.filter(function(x) { return ((x.template_config.stream_name !== undefined) && (x.template_config.stream_name !== ''));}).map(function(x) {return x.template_config.stream_name;});
            my_interest.elements = _.uniq(my_interest.elements);
            my_interest.board_name = $scope.board.name;
            logger.info('Wallboard: I\'m interested in the following element changes', my_interest);
            socket.emit('interested_in',my_interest);
        }
	};
	$scope.reload_board = function() {
	    logger.debug("reload_board");
        $scope.clear_interests();
        Board.get({boardId: $routeParams.boardId}, function(result) {
            if (result.error) {
                $scope.loading=false;
            } else {
                logger.debug(result);
                $scope.board = result;
                $scope.elements = [];
                $scope.board.elements.forEach(function(e) {
                    var new_element = {};
                    new_element.display_config = e.display_config;
                    new_element.element_template = e.element_template;
                    new_element.template_config = {};
                    e.template_config.forEach(function(te) {
                        new_element.template_config[te.name] = te.value;
                    });
                    $scope.elements.push(new_element);
                });
                $scope.loading=false;
                $scope.send_interests();
            }
        }, function(error) {
            $scope.loading=false;
        });
	};
	logger.debug("before reload");
	$scope.reload_board();
	logger.debug("after reload");
    
    $scope.save = function() {
        if (socket.isConnected()) {

            logger.info("Saving wallboard...");
            var new_elements = [];
            $scope.elements.forEach(function(e) {
                var new_element = {};
                new_element.display_config = e.display_config;
                new_element.element_template = e.element_template;
                new_element.template_config = [];
                for (var key in e.template_config) {
                    if (e.template_config.hasOwnProperty(key)) {
                        new_element.template_config.push({name:key,value:e.template_config[key]});
                    }
                }
                new_elements.push(new_element);
            });
            var new_elements_sorted = new_elements.sort(function(a,b) {
                return a.display_config.row-b.display_config.row;
            });
            var boardupdate = {name:$scope.board.name,id:$scope.board_id,elements:new_elements_sorted};
            socket.emit('update_layout',boardupdate);
            notify($scope.board.name + " dashboard saved");
        } else {
            notify("dashboard NOT saved because server is not connected");
        }

    };

    $scope.delayed_save = _.debounce($scope.save,2000,false);
    //var delayed_save = $scope.save;

	
    $scope.gridsterOpts = {
            colWidth: 'auto',
            rowHeight: 'match',
            minColumns: 1,
            minRows: 1,
            columns: 16,
            margins: [5, 5],
            defaultSizeX: 1,
            defaultSizeY: 1,
            minGridRows: 9,
            maxGridRows: 9,
            mobileBreakPoint: 1,
            resizable: {
                enabled: true,
                start: function(event, uiWidget, $element) {
                    $scope.disable_widget_click = true;
                },
                stop: function(event, uiWidget, $element) {
                    $scope.delayed_save();
                },
            },
            draggable: {
                enabled: true,
                start: function(event, uiWidget, $element) {
                    $scope.disable_widget_click = true;
                },
                stop: function(event, uiWidget, $element) {
                    $scope.delayed_save();
                },
            }
    };


    
    
    $scope.widget_modal_opts = {
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            resolve: {
                elements: function() {
                    return $scope.elements;
                },
                current_config:undefined
            },
            templateUrl: 'partials/widget_selector.html',
            controller: 'WidgetSelectorInstanceCtrl',
            //size:'lg'
          };

    $scope.open_AddWidgetDialog = function() {
        if (socket.isConnected()) {

            if (!$scope.disable_widget_click) {

                var widget_current2_modal_opts = $scope.widget_modal_opts;
                widget_current2_modal_opts.resolve.current_config=undefined;
                var d = $modal.open(widget_current2_modal_opts);
                d.result.then(function() {
                    $scope.send_interests();
                    $scope.delayed_save();
                });
            } else {
                $scope.disable_widget_click = false;
            }
        } else {
            notify("Cannot add widget, because server is not connected.");
        }
    };
    
        
    $scope.open_ConfigWidgetDialog = function(event) {
        if (socket.isConnected()) {
            if (!$scope.disable_widget_click) {
                $scope.widget_config = this.data;
                $scope.selected_widget = this.data.element_template;
                var widget_current_modal_opts = $scope.widget_modal_opts;
                that = this;
                widget_current_modal_opts.resolve.current_config=function() {
                    return that.data;
                };
                var d = $modal.open(widget_current_modal_opts);
                d.result.then(function() {
                    $scope.delayed_save();
                }, function() {
                });
            } else {
                $scope.disable_widget_click = false;
            }
        } else {
            notify("Cannot modify widget, because server is not connected");
        }
        
    };
    

    $scope.$on('$destroy', function (event) {
        logger.debug("scope destroy");
        socket.removeAllListeners();
    });
    
/*    $scope.$watch('elements', function(elements) {
        var delayed_save_func = _.throttle(save_layout, 1000, false);
        delayed_save_func();
        $log.debug("tortenes van");
    }, true);*/
	
	socket.on('update', function (data) {
        logger.debug("Socket: got update: ", data);
		$scope.elements.forEach(function(e) {
            if ((e.template_config.stream_name) && (e.template_config.stream_name === data.stream_name)) {
                e.value = data.value;
            }
		});
	});
	socket.on('show_me_your_interest', function(data) {
        //send_interests();
		//create a list of only element ids
		//var my_interest = $scope.elements.filter(function(x){return x.id !== '';}).map(function(x) {return x.id;});
/*	    $scope.elements = [{element_template:'Number',value:'',template_config:{stream_name:'HU_CLD_autodialer_DM_Done_per_minute'},display_config:{col:1,row:1,sizeX:1,sizeY:1}},
	                       {element_template:'Number',value:'',template_config:{stream_name:'HU_CLD_autodialer_DM_Done_per_minute'},display_config:{col:1,row:1,sizeX:2,sizeY:2}},
	                       {element_template:'Number',value:'',template_config:{stream_name:'element2'},display_config:{col:1,row:1,sizeX:2,sizeY:2}},
	                       {element_template:'Number',value:'',template_config:{stream_name:'element2'},display_config:{col:1,row:1,sizeX:3,sizeY:1}},
	                       {element_template:'Number',value:'',template_config:{stream_name:'element2'},display_config:{col:1,row:1,sizeX:3,sizeY:1}},
	                       {element_template:'Number',value:'',template_config:{stream_name:'element2'},display_config:{col:1,row:1,sizeX:3,sizeY:1}},
	                       {element_template:'Number',value:'',template_config:{stream_name:'element2'},display_config:{col:1,row:1,sizeX:3,sizeY:1}},
	                       {element_template:'Number',value:'',template_config:{stream_name:'element2'},display_config:{col:1,row:1,sizeX:3,sizeY:1}},
	                       ];
	*/
	});
    socket.on('client_refresh', function(data) {
        //server asks for reload. data contains milisec delay to avoid every client to request server at the same time
        logger.info("Socket got client_refresh: Page reloading requested", data);
        setTimeout(function() {
            logger.debug("Reloading page.");
            location.reload(true);
        }, Math.random()*data);
    });
    socket.on('reload_board', function(data) {
        logger.debug("Socket got reload_board");
        $scope.reload_board();
    });
    
    /*
     * on first connect do not refresh board,
     * but if server connection lost and reconnected
     * than need to refresh to show the last version of board,
     * streams etc...
     */
    var initial_connect = true;
    socket.on('connect', function() {
        logger.debug('Socketio connected.');
        if (!initial_connect) {
            $log.debug("This is not the first connect so reload the whole board");
            $scope.reload_board();
        }
        initial_connect = false;
    });
    socket.on('disconnected', function() {
        logger.debug("socketio disconnected.");
    });
    socket.on('error', function() {
        logger.debug("socketio error.");
        notify('Server connection lost. Will to reconnect...',3);
    });
    socket.on('connect_failed', function() {
        logger.debug("socketio connect failed.");
    });
    socket.on('reconnecting', function() {
        logger.debug("socketio reconnecting...");
    });
    socket.on('reconnect', function() {
        logger.debug("socketio reconnected.");
        notify('Server connection restored.');
    });

    $scope.getControllers = function(name) {
        if (name === 'analogue_clock') {
            return analogue_clock;
        } else {
            return undefined;
        }
    };
}]);






wallboard.controller('WidgetSelectorInstanceCtrl', ['$scope','$http', '$modalInstance', 'elements', 'socket', 'current_config', '$log', function($scope, $http, $modalInstance, elements, socket, current_config, $log) {
    $scope.minicolors_settings = {
            theme: 'bootstrap',
            position: 'bottom left',
            defaultValue: '',
            animationSpeed: 50,
            animationEasing: 'swing',
            change: null,
            changeDelay: 0,
            control: 'hue',
            hide: null,
            hideSpeed: 100,
            inline: false,
            letterCase: 'lowercase',
            opacity: true,
            show: null,
            showSpeed: 100
    };
    $scope.current_config = current_config;
    $scope.show_config = function(widget) {
        $http({method:'GET', url:'/elements/'+widget.template+'.config.json'}).
        success(function(data, status, headers, config) {
            $scope.widget_config = data;
            $scope.selected_widget = widget;
            if ($scope.current_config) {
                $scope.widget_config.forEach(function(e) {
                    e.value = $scope.current_config.template_config[e.name];
                });
            }
            $log.debug("$scope.widget_config: ",$scope.widget_config);
        }).
        error(function(data, status, headers, config) {
            $log.error("Can not get element config json", current_config);
            $scope.widget_config = undefined;
            $scope.selected_widget = widget;
        });
    };
    $scope.hide_config = function() {
        $scope.widget_config=undefined;
        $scope.selected_widget=undefined;
    };

    
    if ($scope.current_config) {
        $scope.selected = $scope.current_config.element_template;
        var widget = {template:$scope.selected};
          $scope.show_config(widget);
    } else {
        $scope.current_config = undefined;
    }
      $http({method:'GET', url:'/elements/widget_list.json'}).
      success(function(data, status, headers, config) {
          $scope.widgets = data.widgets;
      }).
      error(function(data, status, headers, config) {
          alert("error");
      });

    $scope.close = function(result) {
      $scope.selected=undefined;
      $scope.widget_config=undefined;
      $scope.current_config=undefined;
      $modalInstance.close(result);
    };
    
    $scope.add_widget = function() {
        var display_config =  {col:99,row:99,sizeX:2,sizeY:2};
        var template_config = {};
        $scope.widget_config.forEach(function(e) {
            template_config[e.name] = e.value;
        });//
        var element_template = $scope.selected_widget.template;
        
        var new_element = {element_template:element_template,template_config:template_config,display_config:display_config};
        elements.push(new_element);
        $scope.close();
    };
    
    $scope.delete_widget = function() {
        for (var i=0;i<elements.length;i++) {
            if (elements[i] === current_config) {
                elements.splice(i,1);
            }
        }
        $scope.close();
    };
    
    $scope.modify_widget = function() {
        $scope.widget_config.forEach(function(e) {
            $scope.current_config.template_config[e.name] = e.value;
        });//
        $scope.close();
    };
    
    $scope.stream_list = [];
    socket.on("list_of_streams", function(data) {
       $scope.stream_list = data;
    });
    socket.emit("getStreamsName",{});
    
   
    
  }]);




//Controller for creating a new board
wallboard.controller('BoardNewCtrl', ['$scope','$location','Board', function($scope, $location, Board) {
    // Define an empty board model object
    $scope.board = {
        name: '',
        creator_name: '',
        elements: []
    };
    
    // Validate and save the new board to the database
    $scope.createBoard = function() {
        var board = $scope.board;
        
        // Check that a name was provided
        if(board.name.length > 0) {
            // Create a new board from the model
            var newBoard = new Board(board);
                
            // Call API to save board to the database
            newBoard.$save(function(p, resp) {
                if(!p.error) {
                    // If there is no error, redirect to the main view
                    $location.path('boards');
                } else {
                    alert('Could not create board');
                }
            });
        } else {
            alert('You must enter a name');
        }
    };
}]);

