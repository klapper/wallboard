wallboard.controller('analogue_clock_controller', ['$scope', '$log', '$interval', function($scope, $log, $interval) {
   
    function updateTime() {
        var now = new Date();
        var hour = now.getHours();
        var minute = now.getMinutes();
        var second = now.getSeconds();
        $scope.current_hour = hour + (minute / 60);
        $scope.current_minute = minute + (second / 60);
        $scope.current_second = second;
    }
    updateTime();
    var timeout_id = $interval(function() {
        updateTime();
    }, 1000);

    $scope.$on('$destroy', function(event) {
        $interval.cancel(timeout_id);
    });
    
    $scope.loaded = true;
}]);