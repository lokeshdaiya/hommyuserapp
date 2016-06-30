angular.module('hommy', ['ionic', 'hommy.controllers','hommy.directives','hommy.services','angular-jwt','ngCordova'])
   .run(function ($ionicPlatform, $rootScope, $localstorage,$ionicLoading,userService) {
    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
        window.plugins.OneSignal.setLogLevel({ logLevel: 4, visualLevel: 4 });
        var notificationOpenedCallback = function (jsonData) {
            alert("Test");
            console.log('didReceiveRemoteNotificationCallBack: ' + JSON.stringify(jsonData));
        };

        window.plugins.OneSignal.init("61f0529c-e802-47e6-9714-5301d819b941",
                                       { googleProjectNumber: "330227005526" },
                                       notificationOpenedCallback);
  
        // Show an alert box if a notification comes in when the user is in your app.
        window.plugins.OneSignal.enableInAppAlertNotification(true);
    });
    $rootScope.baseApiUrl="http://128.199.170.13/api";
    if (userService.isUserLoggedIn()) {
        userService.setUserAuth();
    }
//    $rootScope.$on('loading:show', function () {
//        $ionicLoading.show({ template: 'loading...' })
//    })
//
//    $rootScope.$on('loading:hide', function () {
//        $ionicLoading.hide()
//    })
 })
    .config(function ($stateProvider, $urlRouterProvider,$ionicConfigProvider,$httpProvider,$cordovaInAppBrowserProvider) {
//        $httpProvider.defaults.headers.common = { 
//        'authorization': $rootScope.authKey,
//        'Accept': 'application/json;odata=verbose'
//      };
        //set defualt option for inappbrowser
        var defaultOptions = {
            location: 'no',
            clearcache: 'no',
            toolbar: 'no'
          };
         $cordovaInAppBrowserProvider.setDefaultOptions(defaultOptions)
        
        
        $stateProvider
            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'templates/menu.html',
                controller: 'AppCtrl'
            })
            .state('app.kitchens', {
                url: '/kitchens/:location',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/kitchens.html',
                        controller: 'KitchenController'
                    }
                }
            })
            .state('app.favourite', {
                url: '/favourite',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/favourite.html'
                    }
                }
            })

            .state('app.kitchen', {
                url: '/kitchen/:kitchenId/:kitchenName',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/kitchen.html',
                        controller: 'DishController'
                    }
                }
            })
                
            .state('app.searchKitchen', {
                url: '/searchKitchen/',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/searchKitchen.html'
                    }
                }
            })

            .state('app.location', {
                url: '/location',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/location.html',
                        controller: 'getLocation'
                    }
                }
            })
            .state('app.cuisines', {
                url: '/cuisines',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/cuisines.html',
                        controller: 'KitchenController'
                    }
                }
            })
            .state('app.checkout', {
                url: '/checkout',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/checkout.html',
                        controller: 'DishController'
                    }
                }
            })
            .state('app.myorders', {
                url: '/myorders',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/myorders.html',
                        controller: 'UserController'
                    }
                }
            })
            .state('app.chooseaddress', {
                url: '/chooseaddress',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/chooseaddress.html',
                        controller: 'UserController'
                    }
                }
            })
            .state('app.addaddress', {
                url: '/addaddress/:lastUrl',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/addaddress.html',
                        controller: 'UserController'
                    }
                }
            })    
            .state('app.processpayment', {
                url: '/processpayment',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/processpayment.html',
                        controller: 'DishController'
                    }
                }
            })    
            .state('app.login', {
                url: '/login/:nextPage',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/login.html',
                        controller: 'UserController'
                    }
                }
            })
            .state('app.signup', {
                url: '/signup',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/signup.html',
                        controller: 'UserController'
                    }
                }
            })
            ;

            
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/kitchens/mylocation');
       
        //remove back button text
        $ionicConfigProvider.backButton.previousTitleText(false).text('');//.icon('ion-chevron-left');
    });