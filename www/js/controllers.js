angular.module('hommy.controllers', ['hommy.services',"google.places"])
.controller('AppCtrl', function ($scope, $ionicModal, $timeout,$state,locationService,$rootScope,$stateParams,$http,userService) {
        $rootScope.changeLocation = function () {
            $state.go('app.location');
        };
        
        locationService.getCurrentLatLong(function(currentLatLong){  
            var latlong=currentLatLong.latitude+','+currentLatLong.longitude;
            $rootScope.latlong=latlong;
            console.log($rootScope.latlong)
            locationService.getCurrentAddress(latlong,function(address){
                $rootScope.currentAddress = address.full_address;
            });
        });
        
        $rootScope.openDigit=function(){
            var digits = new DigitsCordova('l6Fhj5jK44CU5kEcatg6HPI59', ''); //Replace with your own consumerKey and your url
            digits.open()
            .successCallback(function(loginResponse){
                var oAuthHeaders = loginResponse.oauth_echo_headers;
                var verifyData = {
                    authHeader: oAuthHeaders['X-Verify-Credentials-Authorization'],
                    apiUrl: oAuthHeaders['X-Auth-Service-Provider']
                };
                alert("success");  
            }).failCallback(function(error){
                alert("faile");  
            }).errorCallback(function(error){
                alert("erro");  
            })
        }
        
        $rootScope.logout=function(){
            userService.Logout(function(){
                $state.go("app.kitchens");
            })
        }
 })
.controller('UserController', function($scope, $state,httpService,$localstorage,userService,$rootScope,$ionicHistory,locationService,$stateParams,goBackMany,$filter,$cordovaToast,orderService) {
      $scope.otherAddressType="";
      $scope.signIn = function() {
         var userLoginData={
                        'mobile':$scope.user.mobile.toString(),//convert to handle http request
                        'password':$scope.user.password
         }
          
          userService.Login(userLoginData, function(response){
              console.log(response);
              if(response.status==200){
                  $localstorage.set('hommyAuthKey',response.headers("authorization"));
                  userService.setUserAuth();
                  if($stateParams.nextPage==='checkout'){
                      $state.go("app.checkout");
                  }else{
                      $ionicHistory.nextViewOptions({
                            disableBack: true
                        });
                      $state.go("app.kitchens");
                  }
              }else{
                  $cordovaToast.show("Invalid mobile number or password","long","bottom")
                  //alert("Invalid mobile number or password");
              }
              
          })
          
          //check if user registered or not 
          //if user is not registered then verify number usiing digit api  
//          Digits.init({ 
//              consumerKey: 'l6Fhj5jK44CU5kEcatg6HPI59',
//              callbackURL:''
//          });
//          console.log($scope.mobileNumber);
//          console.log($scope.user.mobileNumber);
//          
//          Digits.logIn({
//                    phoneNumber:'+91'+$scope.user.mobileNumber,
//                    callbackURL:'www.hommy.in'
//                })
//            .done($scope.onDigitLogin) /*handle the response*/
//            .fail($scope.onLoginFailure);
      };
      $scope.onDigitLogin=function(loginResponse){
            console.log(loginResponse);
            // Send headers to your server and validate user by calling Digits’ API
            var oAuthHeaders = loginResponse.oauth_echo_headers;
            var verifyData = {
                authHeader: oAuthHeaders['X-Verify-Credentials-Authorization'],
                apiUrl: oAuthHeaders['X-Auth-Service-Provider']
            };
            $state.go("app.signup")
        }
      $scope.onDigitLoginFailure =function (){
            alert("Verification failed");
        }
      
      $scope.getAddresses=function(){
            $scope.userAddresses=null;
            userService.getUserDetailsById(function(response){
                $scope.userAddresses=response.address;
            });
      }
      
      $scope.chooseAddress=function(address){
          $rootScope.userDetails.defaultAddress=address;
//          $ionicHistory.nextViewOptions({
//                disableBack: true
//          });
          $state.go("app.checkout");
      }
      
      $scope.addAddress=function(){     
          if($scope.adderssFromMap.addressType=="" || $scope.adderssFromMap.address==""){
              $cordovaToast.show("All fields are mandatory","long","bottom")
              //window.alert("All fields are mandatory");
              return false;
          }
          
          if($scope.adderssFromMap.addressType==="Other"){
              $scope.adderssFromMap.addressType=$scope.otherAddressType;
          } 
          var addressObject={address:$scope.adderssFromMap};
          userService.updateUserDetails(addressObject, function(response){
              if(response.status==200){
                  $rootScope.userDetails.defaultAddress.addressType=$scope.adderssFromMap.addressType
                  $scope.userAddresses=response.data.address;
                  if($stateParams.lastUrl==="checkout"){
                        goBackMany(2);
                      //$state.go("app.checkout");
                  }
              }
              
          })
          
          
      }
      $scope.showMap=function(){
            $scope.checkExistingAddressType();
            locationService.getLocationFromMap(function(map){
                $scope.map=map.map;
                $scope.marker=map.marker
            });
      }
      $scope.setAddressType=function(addressType){
            if(addressType=='Home'){
              if($scope.isHomeDisabled){
                  $cordovaToast.show("Home is already Added please select other address type","long","bottom")
                  //alert("Home is already Added please select other address type")
                  return;
              }
              $scope.showother=false;
              $scope.adderssFromMap.addressType='Home';
          }
          if(addressType=='Office'){
              if($scope.isHomeDisabled){
                  $cordovaToast.show("Office is already Added please select other address type","long","bottom")
                  //alert("Office is already Exist please select other address type")
                  return;
              }
              $scope.showother=false;
              $scope.adderssFromMap.addressType='Office';
          }
          
          if(addressType=='Other'){
              $scope.showother=true;
              $scope.adderssFromMap.addressType='Other';
          }
      
      }
      $scope.checkExistingAddressType=function(){
            var addresses=userService.userDetails.address;
            console.log(addresses);
            var homeAddress=$filter('filter')(addresses,{addressType:'Home'});
            var officeAddress=$filter('filter')(addresses,{addressType:'Office'});
            
            if(homeAddress.length >0){
                $scope.isHomeDisabled=true;
            }
            if(officeAddress.length >0){
                $scope.isOfficeDisabled=true;
            }
      }
      
      $scope.getUserOrders=function(){
          $scope.pastOrderList=[]
          $scope.liveOrderList=[]
          orderService.getOrderDetails(function(response){
              $scope.pastOrderList=$filter('filter')(response,{orderStatus:"Placed"});
              $scope.liveOrderList=$filter('filter')(response,{orderStatus:"!Placed"});
          });
      };
      
      $scope.GetCurrentLocation=function(){    
            if($scope.marker!=null && $scope.marker!=undefined){
                var latlong=$scope.marker.getPosition().lat()+','+$scope.marker.getPosition().lng();
                locationService.getCurrentAddress(latlong,function(address){
                    $scope.adderssFromMap={area:address.full_address,city:address.city,addressType:"",address:""}
                });
            }
         }
  
  })
    .controller('KitchenController', function ($scope, $state,$stateParams,$rootScope,httpService,$filter) {

        $scope.filter = {
            veg:false,
            quick:false,
            cuisines:false
        };

        $scope.filterByVeg = function(){
            console.log($scope.homeFilter);
            if($scope.filter.veg){
                $scope.filter.veg = false;
                $scope.homeFilter.pureVeg='';
            }else{
                 $scope.filter.veg = true;
                 $scope.homeFilter.pureVeg=true;
            }
        };

        $scope.filterByQuick = function(){
            if($scope.filter.quick){
                $scope.filter.quick = false;
                $scope.kitchenSort = '-deliveryTime';
            }else{
                $scope.filter.quick = true;
                $scope.kitchenSort = 'deliveryTime';
            }
        };
        
        //get all kitchen List
        $scope.getAllKitchenList=function(){
            var kitchenApiUrl=$rootScope.baseApiUrl+"/kitchens"
            var config = {headers: {
                'authorization': $rootScope.authKey,
                'Accept': 'application/json'
                }
            };
            httpService.GetData(kitchenApiUrl,config,function(response){
                $scope.chefs=response;
            });
        }
        
        //get all kitchen List
        $scope.getNearByKitchens=function(){
            $rootScope.latlong="17.4515258,78.3788687";
            var kitchenApiUrl=$rootScope.baseApiUrl+"/kitchens/find";
            var config = {params: {
                loc: $rootScope.latlong
                }
            };
            var distance=10;
            if(distance!=null){config.params.dis=distance;}
            httpService.GetData(kitchenApiUrl,config,function(response){
                $scope.chefs=response;
                $rootScope.kitchenList=response;//this is temparory solution to get kitchens across pages
            });
        }
        
        //get single kitchen
        $scope.getKitchen = function (id) {
                $state.go('app.kitchen', {chefId: $scope.chefs[id].objectId,name:$scope.chefs[id].name});
        };
        //get cusines list
        $scope.getCuisines=function(){
            var cuisineApiUrl=$rootScope.baseApiUrl+"/cuisines";
            var config = {headers: {
                'authorization': $rootScope.authKey,
                'Accept': 'application/json'
                }
            };
            httpService.GetData(cuisineApiUrl,config,function(response,headers){
                $scope.cuisinesArray=response;
            });
        }
        
        //$scope.getAllKitchenList();
          $scope.getNearByKitchens();
    })
    .controller('DishController', function ($scope, $stateParams,$rootScope,httpService,$filter,$state,dishService,userService,orderService,$cordovaToast) {
        $scope.deliveryCharges=0.00;
        $scope.kitchenName = $stateParams.kitchenName;
        $scope.kitchenId=$stateParams.kitchenId;
        $scope.orderDishes=dishService.orderDishList;
        
        $scope.getDishes=function(){
            dishService.getDishList($stateParams.kitchenId,function(){
                $scope.dishes = dishService.dishes;
                if(dishService.orderDishList.length>0){
                    $scope.cartItemCount=0;
                    angular.forEach(dishService.orderDishList,function(value){
                        var record=$filter('filter')($scope.dishes,{_id:value._id})[0]
                        var index=$scope.dishes.indexOf(record);
                        if(dishService.orderDishList[0]._kitchen==$scope.kitchenId)
                            $scope.dishes[index].cartCount=value.cartCount;
                        $scope.cartItemCount+=value.cartCount;
                    })
                 
                }
            });
        }
        
        $scope.gotoCheckOut=function(){
            if(!userService.isUserLoggedIn()){
                $state.go("app.login",{nextPage:"checkout"});
            }
            else{
                $state.go('app.checkout');
            }
            
        }
        $scope.checkCart=function(){
            $scope.cartItemCount=0;
             var cartItems=[];
             cartItems=$filter('filter')($scope.dishes,{cartCount:"!0"});
             angular.forEach(cartItems,function(value){
                 $scope.cartItemCount+=value.cartCount;
             })
             
        }
        $scope.increase = function (index) {
                if(dishService.orderDishList.length>0 && dishService.orderDishList[0]._kitchen!=$scope.kitchenId){
                    //get kitchen name to display
                    var kitchenName=$filter('filter')($rootScope.kitchenList,{_id:dishService.orderDishList[0]._kitchen});

                    var isDiscard=window.confirm("You have already items in cart from Kitchen "+kitchenName[0].name +". Do you want to Discard?");
                    if(isDiscard){
                        dishService.orderDishList=[];
                        $scope.orderDishes=[];
                    }else{
                        return false;
                    }
                }
                $scope.dishes[index].cartCount++;
                $scope.dishes[index].totalCost=$scope.dishes[index].cartCount*$scope.dishes[index].price
                $scope.orderDishes=dishService.orderDishList=$filter('filter')($scope.dishes,{cartCount:"!0"});      
                //dishService.orderDishList.kitchenName=$scope.kitchenName
                $scope.checkCart();
                $scope.getItemCost();
        };
        $scope.decrease = function (index) {
                $scope.dishes[index].cartCount--;
                $scope.dishes[index].totalCost=$scope.dishes[index].cartCount*$scope.dishes[index].price
                $scope.orderDishes=dishService.orderDishList=$filter('filter')($scope.dishes,{cartCount:"!0"});
                $scope.checkCart();
                $scope.getItemCost()
        };
        $scope.getItemCost=function(){
            $scope.subTotal=0;
            angular.forEach(dishService.orderDishList,function(value){
                $scope.subTotal+=value.totalCost;
            })
        }
        $scope.getTotalCost=function(){
            $scope.deliveryCharges=0;
            $scope.getItemCost();
            if($scope.subTotal<=350){
                $scope.deliveryCharges=40
            }
            $scope.totalCost=$scope.subTotal+$scope.deliveryCharges;
            
        }
        
        $scope.startPayment=function(){
            alert("in startPayement");
            window.plugins.paytm.startPayment('ORDS621863990', 'cust1', 'ldlcuky2009@gmail.com', '7777777777', '1',
                function(response){
                    alert(response)
                    console.log(response);
                }, 
                function(response){
                    alert(response)
                    console.log(response);
                }
            );
        }
        
        
        $scope.placeOrder=function(){
                var kitchenId=$scope.orderDishes[0]._kitchen
                var address=$rootScope.userDetails.defaultAddress.address+$rootScope.userDetails.defaultAddress.area;
                var itemArray=[];
                
                //create Item array
                angular.forEach($scope.orderDishes,function(value){
                    var itemObject={
                          "_item": value._id,
                          "qty": value.cartCount,
                          "price": value.price,
                          "itemName": value.name
                        }
                        itemArray.push(itemObject);
                })
                
                //create json data to pass order api
                var orderData={
                      "items":itemArray,
                      "_kitchen": kitchenId,
                      "deliveryType": "Online",
                      "orderTotal": $scope.totalCost,
                      "shippingAddress": address
                }
                //add order details
                orderService.addOrder(orderData,function(response){
                    console.log(response)
                    if(response.status==201){
                        var options = {
                            //description: 'Credits towards consultation',
                            //image: 'https://i.imgur.com/3g7nmJC.png',
                            currency: 'INR',
                            key: 'rzp_test_lNioPsJjgB7P5M',
                            amount: $scope.totalCost,
                            name: 'Hommy',
                            prefill: {email: $rootScope.userDetails.email, contact: $rootScope.userDetails.mobile, name: $rootScope.userDetails.name},
                            theme: {color: '#F37254'}
                        }
                        $scope.Razorpay(options);
                    }
                    else{
                        $cordovaToast.show("Oops...Something went wrong please try again..","long","bottom")
                        //alert("Oops...Something went wrong please try again..");
                    }
                });
                

        }
        $scope.processPayment=function(){
              console.log($scope.paymentPayLoad);
              var generateCheckSumUrl=$rootScope.baseApiUrl+"/payment/m/generate-checksum"
              var data={
                      orderId: "3",
                      userId: "2",
                      amount: "1",
                      callback: "/callback",
                      mobile: "7777777777",
                      email: "admin@hommy.in"
                    }
                var headers= {
                    'authorization': $rootScope.authKey,
                    'Accept': 'application/json'
                    }
                httpService.PostData(generateCheckSumUrl,data,headers,function(response){
                    $rootScope.formData=response.data;
                    var processPaymentUrl="https://pguat.paytm.com/oltp-web/processTransaction";
                    var headers={
                        'Content-Type':'application/x-www-form-urlencoded',
                        'Accept':"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
//                        
                    };
                    
                    var formData={"MID":"XHJpVK94398467373720",
                    "ORDER_ID":"ORDS11077618",
                    "CUST_ID":"CUST001",
                    "INDUSTRY_TYPE_ID":"Retail",
                    "CHANNEL_ID":"WEB",
                    "TXN_AMOUNT":"1",
                    "WEBSITE":"Hommywap",
                    "CALLBACK_URL":"/callback",
                    "CHECKSUMHASH":$rootScope.formData.CHECKSUMHASH
                    }
                    httpService.PostData(processPaymentUrl,$.param(formData),headers,function(response){
                    console.log(response);
                    });
                    
                    //$state.go("app.processpayment");
                });
            }
            
        $scope.Razorpay=function(options){  
                var successCallback = function(payment_id) {
                    $cordovaToast.show("Your order placed successfully","long","bottom");
                    $state.go("app.myorders");
                }

                var cancalCallback = function(error) {
                    $cordovaToast.show("something went wrong, please try again","long","bottom");
                }

                RazorpayCheckout.open(options, successCallback, cancalCallback);
              }
        
    })
    
    .controller('getLocation',function($scope,$state,$ionicViewService,$ionicHistory,$rootScope,locationService) {

        $scope.myScopeVar = '';

        $scope.autocompleteOptions = {
            componentRestrictions: {
                country: 'IND'
            },
            types: ['geocode']
        };

       
       $scope.$on('g-places-autocomplete:select', function (place) {
            console.log(place);
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $rootScope.currentAddress=place.targetScope.model.formatted_address
            $state.go('app.kitchens', {});
        });

        $scope.goBack = function () {
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go('app.kitchens', {location: 'mylocation'});
        }
        
        $scope.showMap=function(){
           navigator.geolocation.getCurrentPosition(function(pos) {
                var myLatlng=new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                var mapOptions = {
                    center: myLatlng,
                    zoom: 16,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                var map = new google.maps.Map(document.getElementById("map"),
                mapOptions);
                $scope.marker = new google.maps.Marker({
                    position: myLatlng,
                    map: map,
                    //title: 'Current Location',
                    draggable:true
                });
                $scope.map = map;
                //google.maps.event.addListener($scope.marker, 'dragend',$scope.GetCurrentLocation());
            }, function(error) {
                alert('Unable to get location: ' + error.message);
            });
            
        };
        
        $scope.GetCurrentLocation=function(){    
            if($scope.marker!=null && $scope.marker!=undefined){
                var latlong=$scope.marker.getPosition().lat()+','+$scope.marker.getPosition().lng();
                locationService.getCurrentAddress(latlong,function(address){
                    $scope.adderssFromMap = address.full_address;
                });
            }
         }        
        
        //google.maps.event.addDomListener(window, 'load', $scope.showMap());
        

    }) ;
    