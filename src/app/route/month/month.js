'use strict';


angular.module('w11kcal.app.month', []);
angular.module('w11kcal.app.month').config(/*ngInject*/ function ($stateProvider) {

    $stateProvider
        .state('app.month', {
            url: '/month/{date}',
            views: {
                'menuContent': {
                    templateUrl: 'route/month/month.html',
                    controller: 'monthCtrl'
                }
            },
            resolve: {
                'asInitService':function (initService) {
                    return initService.init();
                }
            }
        });
});







angular.module('w11kcal.app.month').run(function () {
});

angular.module('w11kcal.app.month').controller('monthCtrl', /*ngInject*/ function (initService, $timeout, $interval, $ionicScrollDelegate,archiveCard, $scope, changeDate,Notification, saveService,$window,$stateParams, $location,buildCalService) {


    /**
     * Part 1: config
     */


    var Caltoday, month, year,  today;

    if(saveService.print()) {
        $scope.login = true;
    }



    // set transmitted month
    var setDate = $stateParams.date.split('-', 2);
    Caltoday = new Date(setDate[0],(setDate[1]-1), 1);

    if(setDate[1] === undefined) {
        // wrong date set in url, redirecting to today
        Caltoday = new Date();
        $location.path("/app/month/"+Caltoday.getFullYear()+"-"+(Caltoday.getMonth()+1)).replace();
    }



    var date = {};
    date.year = Caltoday.getFullYear();
    date.month = Caltoday.getMonth();
    today = {};
    today.year = new Date().getFullYear();
    today.month = new Date().getMonth();
    $scope.today = !(date.year === today.year && date.month === today.month);

    $scope.date = {
        iso: Caltoday,
        monthName: moment.months()[date.month],
        month: date.month,
        year: date.year
    };


    $scope.toToday = function () {
        $location.path("/app/month/"+today.year+"-"+(today.month+1));
    };


    /**
     * Part 2: Build
     */

        // top legende
    $scope.weekdays = [];
    for (var i = 0; i <= 6; i++) {
        var long =  moment().weekday(i).format("dddd");
        var short = moment().weekday(i).format("dd");
        $scope.weekdays[i] = [short, long];
    }

    $scope.days = buildCalService.build(date).days;
    $scope.config = buildCalService.build(date).config;



    // Build Filter
    $scope.boards = [];
    _.forEach(saveService.print()[2].data, function (board) {
        $scope.boards.push({
            name: board.name,
            id: board.id,
            ticked: true,
            color: board.prefs.backgroundColor
        });
    });
    $scope.multipleDemo = {};
    $scope.multipleDemo.selectedBoards = $scope.boards;
    $scope.activeBoard = function (card) {
        return _.find($scope.multipleDemo.selectedBoards, { 'id': card.idBoard});
    };


    /**
     * Part 3: Options:
     */
    $scope.loading = false;
    $scope.refresh = function () {
        if($scope.loading === false) {
            $scope.loading = true;
            initService.init(1)
                .then(function () {
                    $scope.loading = false;
                    $scope.days = buildCalService.build(date).days;
                    $scope.config = buildCalService.build(date).config;
                });
        }
    };




    $scope.logout = function () {
        saveService.remove();
        $scope.login = false;
        console.log(saveService.print());
        $window.location.reload();
    };





    $scope.move = function (steps) {
        year = date.year;
        month = (date.month + steps);
        if(month >= 12) {
            month = 0;
            year++;
        } else if ( month <= -1) {
            month = 11;
            year--;
        }
        $location.path("/app/month/"+year+"-"+(month+1));
    };





    // Drag 'n Drop
    $scope.onDragSuccess = function (data, evt, date) {
        var day = _.findIndex($scope.days, function(chr) {
            return chr.date === date;
        });
        var index = $scope.days[day].cards.indexOf(data);
        if (index > -1) {
            $scope.days[day].cards.splice(index, 1);
        }
    };

    $scope.onDropComplete = function (data, evt, targetDate) {

        data.waiting = true;


        var day = _.findIndex($scope.days, function(chr) {
            return chr.date === targetDate;
        });




        if(typeof $scope.days[day].cards === 'undefined') {
            $scope.days[day].cards = [];
            $scope.days[day].cards[0] = data;

        } else {
            var index = $scope.days[day].cards.indexOf(data);
            if (index === -1) {
                $scope.days[day].cards.push(data);
            }
        }


        var time  = new Date (data.badges.due);

        targetDate.setHours(time.getHours(), time.getMinutes(), time.getSeconds());

        changeDate.async(data.id, targetDate).then(function () {
                console.log("succes");
                data.waiting = false;
                data.due = targetDate;
                data.badges.due = targetDate;
            },
            function () {
                console.log("err");
            });
    };





    $scope.archiveCard = function (data) {
        var id = data.id;
        archiveCard.async(id).then(function () {
            var message = '<span ng-controller="archiveCtrl"><br>Archived </span>';
            Notification.warning({message: message});
        });
    };




    $scope.showDetail = false;
    $scope.detail = function (id) {
        $scope.showDetail = true;
        $ionicScrollDelegate.scrollBottom();
        $scope.singleCard =_.find(saveService.print()[1].data, { 'id': id});
    };



    $scope.closeDetail = function () {
        $scope.showDetail = false;
    };


    $interval(function () {
        if($scope.doRefresh) {
            $scope.refresh();
        }
    }, 30000, 0, false);



});







angular.module('w11kcal.app.month').filter('propsFilter', function () {
    return function (items, props) {
        var out = [];

        if (angular.isArray(items)) {
            items.forEach(function (item) {
                var itemMatches = false;

                var keys = Object.keys(props);
                for (var i = 0; i < keys.length; i++) {
                    var prop = keys[i];
                    var text = props[prop].toLowerCase();
                    if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                        itemMatches = true;
                        break;
                    }
                }

                if (itemMatches) {
                    out.push(item);
                }
            });
        } else {
            out = items;
        }

        return out;
    };
});

