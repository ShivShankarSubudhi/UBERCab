var cab = angular.module("cab",[]);
cab.constant("props",{
	maps_url : "https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial",
	uber_url : "https://api.uber.com/",
	maps_key : "AIzaSyB6ky0s6kmaxH15hsxsNHKuZeI6n_OG2eA",
	uber_key : "ECWcv5urK26d-pz-OHio9c9ovHpahx4UBbQIzMTi",
	travel_mode : "driving",
	maps_deviation : 60,
	uber_time_max : 15
});
cab.factory('mapsFactory',['$http','$q','props',function($http,$q,props){
	return {
		getTime : function(src, dest){
			var def = $q.defer();
			$http({
				method : 'GET',
				url : props.maps_url + "&origins=" + src +"&destinations=" + dest +"&mode=" + props.travel_mode + "&key=" + props.maps_key
			}).then(
				function(response){
                    	console.log(response);
					if(response.data.rows[0]["elements"][0]["status"] === "OK")
						def.resolve({data : response.data.rows[0]["elements"][0]["duration"]["value"]});
					else
						def.reject({status : response.data.rows[0]["elements"][0]["status"]});
				},
				function(error){
					def.reject({status : error});
				}
			);
			return def.promise;
		}
	}
}]);

cab.factory('uberFactory',['$http','$q','props',function($http,$q,props){
	return {
		getTime : function(lat, long){
			var def = $q.defer();
			$http({
				method : 'GET',
				url : props.uber_url + "v1/estimates/time?start_latitude=" + lat + "&start_longitude=" + long,
				headers: {
			    	Authorization: "Token " + props.uber_key
			    }
			}).then(
				function(response){
					if(response.statusText === "OK"){
						def.resolve({data : response.data.times});
					}
					else{
						def.reject({status : response.statusText});
					}
				},
				function(error){
					def.reject({status : error});
				}
			);
			return def.promise;
		}
	}
}]);

cab.factory('utils',[function(){
	return {
		getLatLong : function(location){
			var lat_long = {lat : location.split(",")[0], long : location.split(",")[1]};
			return lat_long;
		},
		getCurrentTime : function(){
			var current_time = new Date();
			current_time = current_time.getHours() * 60 + current_time.getMinutes();
			return current_time;
		},
		getTimeDiff : function(t1, t2){
			var current_time = this.getCurrentTime();
			if(current_time + t2 === t1){
				return 0;
			}
			else if(current_time + t2 < t1){
				return t1 - current_time - t2;
			}
			else{
				return -1;
			}

		},
		getUberGoTime : function(timesArray){
			var i;
			for(i = 0; i<timesArray.length; i++ ){
				if(timesArray[i].display_name === "uberGO")
					return timesArray[i].estimate;
			}
			if(i === timesArray.length){
				return 0;
			}
		}
	}
}]);


cab.controller("CabCtrl",['$scope','mapsFactory','uberFactory','utils','$timeout','$interval','props','$http',function($scope,maps,uber,utils,$timeout,$interval,props,$http){

	$scope.booking = {};
	$scope.booking.requests = [];
	$scope.booking.source = "";
	$scope.booking.destination = "";
	$scope.booking.time = {};
	$scope.booking.time.hour = "";
	$scope.booking.time.minute = "";
	$scope.booking.email = "";
	$scope.booking.logs = [];

	$scope.booking.addRequest = function(){
		var time = $scope.booking.time.hour * 60 + $scope.booking.time.minute;
		var request = {
			source : $scope.booking.source,
			destination : $scope.booking.destination,
			schedule : time,
			email : $scope.booking.email
		};
		$scope.booking.reminder(request);
	};

	$scope.booking.reminder = function(request){
		var time_log = new Date();
		$scope.booking.logs.push({api : "MAPS", user : request.email, time : (time_log.getHours() + " : " + time_log.getMinutes())});
		maps.getTime(request.source, request.destination).then(
			function(response){
				request.maps_time = Math.floor(response.data/60);
				request.maps_time_max = request.maps_time_max || request.maps_time + props.maps_deviation;
				var lat_long = utils.getLatLong(request.source);
				time_log = new Date();
				$scope.booking.logs.push({api : "UBER", user : request.email, time : (time_log.getHours() + " : " + time_log.getMinutes())});
				uber.getTime(lat_long.lat, lat_long.long).then(
					function(response){
						request.uber_time = Math.floor(utils.getUberGoTime(response.data)/60);
						request.uber_time = request.uber_time <= props.uber_time_max ? request.uber_time : props.uber_time_max;
						request.total_travel_time = request.maps_time + request.uber_time;
						request.total_travel_time_max = request.maps_time_max + props.uber_time_max;
						$scope.booking.checkRemainingTime(request);
					},
					function(error){
						console.log(error.status)
					}
				);
			},
			function(error){
				console.log(error.status);
			}
		);
	};

	$scope.booking.checkRemainingTime = function(request){
		var time_remaining = utils.getTimeDiff(request.schedule, request.total_travel_time);
		if(time_remaining === 0){
			if(angular.isDefined(request.interval_var)){
				$interval.cancel(request.interval_var);
			}
            var message = request.email + ", please book a cab now";
            $scope.send_email(message,request.email);
		}
		else if(time_remaining !== -1 && time_remaining < request.total_travel_time_max){
			if(angular.isDefined(request.interval_var)){
				$interval.cancel(request.interval_var);
			}
			request.interval_var = $interval(function(){$scope.booking.reminder(request)}, 60000);
		}
		else if(time_remaining > request.total_travel_time_max){
			request.timeout_var = $timeout(function(){$scope.booking.reminder(request)},(time_remaining - request.total_travel_time_max)*1000);
		}
		else{
            var message = request.email + "! Its already late to book the cab.";
            $scope.send_email(message,request.email);
		}
	};


    $scope.send_email = function(message,email){
        var m_data = new FormData();
        m_data.append('message',message);
        m_data.append('email',email);
        $http.post('/mail.php', m_data, {
          transformRequest: angular.identity,
          headers: {'Content-Type': undefined}
        }).success(function(data){
           if (!data.success) {
               alert('Mail Sending Error');
           } else {
               alert('Customer Intimated Successfully through Email');
           }
        });
    }

}]);
