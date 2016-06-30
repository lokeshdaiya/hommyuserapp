/**
 * Created by Ramesh on 12/14/2015.
 */
angular.module('hommy.services',[])
    .service('httpService',function($http,$rootScope){
        var httpService={}
        httpService.GetData=function(url,params,callback){
            var success=function(response,status,headers,config){
                callback(response,headers);
            }
            var error=function(response,status,headers,config){
                callback(response,headers);
            }
            $http.get(url,params).success(success).error(error);
        };

        httpService.PostData=function(url,data,headers,callback){
            $http({
                method:"POST",
                url:url,
                headers:headers,
                data:data
            })
            .then(
                function(response){
                    callback(response);
                },
                function(response){
                    callback(response);
                }
            )
        };
        
        httpService.PutData=function(url,data,headers,callback){
             $http({
                 method:'PUT',
                 url:url,
                 data:data,
                 headers:headers
             })
             .then(
             function(response){
                 callback(response)
             }
            ,function(response){
                 callback(response)
             })
            //$http.put(url,params).success(success).error(error);
        };

        return httpService;
     })
     
     .service('locationService',function(httpService,$filter){
         //get current latitude and longitude
         this.map=null;
         this.mapMarker=null;
         this.getCurrentLatLong=function(callback){
             var currentLatLong={}
             navigator.geolocation.getCurrentPosition(function(position) {
                 currentLatLong.latitude=position.coords.latitude;
                 currentLatLong.longitude= position.coords.longitude;
                 callback(currentLatLong);
             })
         }
         
         this.getLocationFromMap=function(callback){
             this.getCurrentLatLong(function(latlong){
               var myLatlng=new google.maps.LatLng(latlong.latitude, latlong.longitude);
                var mapOptions = {
                    center: myLatlng,
                    zoom: 16,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                var map = new google.maps.Map(document.getElementById("map"),
                mapOptions);
                this.marker = new google.maps.Marker({
                    position: myLatlng,
                    map: map,
                    //title: 'Current Location',
                    draggable:false
                });
                this.map = map;  
                this.marker.bindTo('position', this.map, 'center');
                callback(this);
             })
         }
         
         //get current address based on lat long
         this.getCurrentAddress=function(latlong,callback){
             var googleApiUrl='http://maps.googleapis.com/maps/api/geocode/json?latlng=' + latlong + '&sensor=true'
             httpService.GetData(googleApiUrl, {}, function(response){
                 var currentAddress={}
                 currentAddress.full_address= response.results[0].formatted_address;
                 
                 //get city
                 var cityArr=$filter('filter')(response.results[0].address_components,{types:"locality"},true);
                 if(cityArr!=undefined || cityArr[0]!=null){
                    currentAddress.city=cityArr[0].long_name
                 }
                 //get district
                 var districtArr=$filter('filter')(response.results[0].address_components,{types:"administrative_area_level_2"},true);
                 if(districtArr!=undefined || districtArr[0]!=null){
                    currentAddress.district=districtArr[0].long_name
                 }
                 
                 //get state
                 var stateArr=$filter('filter')(response.results[0].address_components,{types:"administrative_area_level_1"},true);
                 if(stateArr!=undefined || stateArr[0]!=null){
                    currentAddress.state=stateArr[0].long_name
                 }
                 callback(currentAddress);
             })
         }
         //return locationService;         
     })
     .service('dishService',function(httpService,$rootScope){
         var dishService={};
         dishService.dishes=[];
         dishService.orderDishList=[];
         
         dishService.getDishList=function(kitchenId,callback){
            var dishApiUrl=$rootScope.baseApiUrl+"/kitchens/"+kitchenId+"/items";
            httpService.GetData(dishApiUrl,{},function(response,headers){
                dishService.dishes=response;
                callback();
            });
         }
         
         return dishService;
     })
     
     .factory('userService',function(httpService,$rootScope,$localstorage,jwtHelper){
         var userService={};
         userService.userDetails={};
         
         
         userService.isUserLoggedIn=function(){
             return $localstorage.get('hommyAuthKey')!=undefined && $localstorage.get('hommyAuthKey')!=null && $localstorage.get('hommyAuthKey')!="undefined" && $localstorage.get('hommyAuthKey')!="null";
         }
         userService.setUserAuth=function(){
            
                $rootScope.authKey = $localstorage.get('hommyAuthKey');
                //decode authkey using JSON web token helper
                $rootScope.userDetails=jwtHelper.decodeToken($rootScope.authKey);
                $rootScope.userid=$rootScope.userDetails._id;
                userService.getUserDetailsById(function(response){
                  $rootScope.userDetails=response;
                  $rootScope.userDetails.defaultAddress={addressType:""};
                  $rootScope.mobileNumber=$rootScope.userDetails.mobile;
                  $rootScope.userOrderDetails={};  
                })
            
          }
         
         userService.Logout=function(callback){
               $localstorage.setObject('hommyAuthKey',null)
                $rootScope.authKey = null;
                $rootScope.userDetails=null;
                $rootScope.userid=null;
                $rootScope.mobileNumber=null;
                $rootScope.userOrderDetails={};
                callback();
         }
         
         userService.Login=function(data,callback){
             var loginApiUrl=$rootScope.baseApiUrl+"/user/sign-in";
             httpService.PostData(loginApiUrl, data, {}, function(response){
                 callback(response);
             })
         }
         //get user details
         userService.getUserDetailsByMobile=function(callback){
            var userApiUrl=$rootScope.baseApiUrl+"/users/mobile/"+$rootScope.mobileNumber;
            var config = {headers: {
                'authorization': $rootScope.authKey,
                'Accept': 'application/json'
                }
            };
             httpService.GetData(userApiUrl, config,function(response){
                 userService.userDetails=response;
                 callback(response);
             })
         }
         
         userService.getUserDetailsById=function(callback){
            var userApiUrl=$rootScope.baseApiUrl+"/users/"+$rootScope.userid;
            var config = {headers: {
                'authorization': $rootScope.authKey,
                'Accept': 'application/json'
                }
            };
             httpService.GetData(userApiUrl, config,function(response){
                 userService.userDetails=response;
                 callback(response);
             })
         }
         
         userService.addUser=function(callback){
             
         }
         
         userService.updateUserDetails=function(body,callback){
            var userApiUrl=$rootScope.baseApiUrl+"/users/"+$rootScope.userid;
            var headers={'authorization': $rootScope.authKey};
             httpService.PutData(userApiUrl, body,headers,function(response){
                 userService.userDetails=response;
                 callback(response);
             })
         }
         return userService;
     })
     .service('orderService',function(httpService,$rootScope){
         var orderService={};
         //add order
         orderService.addOrder=function(data,callback){
              var headers= {
                'authorization': $rootScope.authKey,
                'Accept': 'application/json'
                }
                
            var orderApiUrl=$rootScope.baseApiUrl+"/users/"+$rootScope.userid+"/orders";   
             httpService.PostData(orderApiUrl, data, headers, function(response){
                 callback(response);
             })
         };
         
         //update order
         orderService.updateOrder=function(orderId,data,callback){
             var headers= {
                'authorization': $rootScope.authKey,
                'Accept': 'application/json'
                }
                
             var orderApiUrl=$rootScope.baseApiUrl+"/users/"+$rootScope.userid+"/orders";   
             var updateOrderUrl=orderApiUrl+"/"+orderId
             httpService.PutData(updateOrderUrl, data, headers, function(response){
                 callback(response);
             })
         }
         
         //get Order details
         orderService.getOrderDetails=function(callback){
             var headers= {
                'authorization': $rootScope.authKey,
                'Accept': 'application/json'
                }
                
             var orderApiUrl=$rootScope.baseApiUrl+"/users/"+$rootScope.userid+"/orders";   
             var config={headers:headers};
             httpService.GetData(orderApiUrl, config, function(response){
                 callback(response);
             })
         }
         
         return orderService;
     })
     .factory('Base64', function () {
    /* jshint ignore:start */

    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    return {
        encode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
					keyStr.charAt(enc1) +
					keyStr.charAt(enc2) +
					keyStr.charAt(enc3) +
					keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);

            return output;
        },

        decode: function (input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                window.alert("There were invalid base64 characters in the input text.\n" +
					"Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
					"Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";

            } while (i < input.length);

            return output;
        }
    };

    /* jshint ignore:end */
})

.service('goBackMany',function($ionicHistory){
  return function(depth){
    // get the right history stack based on the current view
    var historyId = $ionicHistory.currentHistoryId();
    var history = $ionicHistory.viewHistory().histories[historyId];
    // set the view 'depth' back in the stack as the back view
    var targetViewIndex = history.stack.length - 1 - depth;
    $ionicHistory.backView(history.stack[targetViewIndex]);
    // navigate to it
    $ionicHistory.goBack();
  }
})
     
    .factory('$localstorage',function($window) {
      return {
            set: function(key, value) {
              $window.localStorage[key] = value;
            },
            get: function(key, defaultValue) {
              return $window.localStorage[key] || defaultValue;
            },
            setObject: function(key, value) {
              $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function(key) {
              return JSON.parse($window.localStorage[key] || '{}');
            }
      }
   })
    .filter('getRatings',function() {
        return function (a) {
            if (a < 3) {
                return 'star-light';
            } else if (a < 4) {
                return 'star-green-ex-light';
            } else if (a < 4.6) {
                return 'star-green-light';
            } else if (a <= 5)
                return 'star-green-dark';
        }
    })
    .filter('addarrays',function() {
        return function (a) {
            var _b = '';
            /*angular.forEach(a, function (e, i) {
                var cus = Parse.Object.extend("cuisines");
                var Query = new Parse.Query(cus);
                Query.equalTo("objectId", e);
                Query.find(function(r){
                    _b += r[0].attributes.cuisine+ ', '
                });
            });*/
            return 'Cuisines';
        }
    });