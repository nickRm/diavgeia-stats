/* global app */

app.controller('ModalController', ['$scope', '$uibModalInstance', 'title', 'data',
        function($scope, $uibModalInstance, title, data) {

    this.title = title;
    this.data = data;

    $scope.openDecisionInNewTab = function(ada) {
        window.open('https://diavgeia.gov.gr/decision/view/' + ada, '_blank');
    };

    $scope.close = function() {
        $uibModalInstance.close();
    };
}]);
