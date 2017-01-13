/* global app */

app.service('ApiService', ['$http', '$q', '$filter', 'Constants', function($http, $q, $filter) {

    this.BASE_URL = '//aetos.it.teithe.gr/~nrammos/php/getdata.php';
    this.CACHE_URL = '//aetos.it.teithe.gr/~nrammos/cache/';
    this.PAGE_SIZE = 500;

    /**
     * Converts a date object to the ISO date format YYYY-MM-DD.
     *
     * @param {Object} date - date to be formatted.
     * @returns {String} - the formatted date.
     */
    this.toIsoDate = function(date) {
        return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    };

    /**
     * Passes a query to an HTTP GET request and returns a promise.
     *
     * @param {String} queryString - the query.
     * @returns {Object} - the promise.
     */
    this.getRequest = function(queryString) {
        var def = $q.defer();

        return $http.get(this.BASE_URL, {
            params: {
                "queryString": queryString
            }
        }).success(function(response) {
            def.resolve(response);
        }).error(function() {
            def.reject('Error');
        });

        return def.promise;
    };

    /**
     * Fetches a file containing cached JSON data.
     *
     * @param {String} fileName - name of the file.
     * @returns {Object} - a promise.
     */
    this.getCachedObject = function(fileName) {
        var def = $q.defer();

        $http.get(this.CACHE_URL + fileName)
        .success(function(response) {
            def.resolve(response);
        })
        .error(function() {
            def.reject('Error');
        });

        return def.promise;
    };

    /**
     * Saves a JSON object to the cache.
     *
     * @param {Object} data - data to be saved
     */
    this.saveToCache = function(data) {
        $http.post('//aetos.it.teithe.gr/~nrammos/php/save.php', data).success(function() {
            console.log('success');
        }).error(function() {
            console.log('error');
        });
    };

    /**
     * Gets all decisions between two dates from the API.
     *
     * @param {Object} dateFrom  - start date.
     * @param {Object} dateTo - end date.
     * @returns {Object} - a promise.
     */
    this.getDecisionsInRange = function(dateFrom, dateTo) {
        return this.getRequest('/search?from_issue_date=' + this.toIsoDate(dateFrom)
                                + '&to_issue_date=' + this.toIsoDate(dateTo)
                                + '&size=' + this.PAGE_SIZE);
    };

    /**
     * Gets all decision types from the API.
     *
     * @returns {Object} - a promise.
     */
    this.getDecisionTypes = function() {
        return this.getRequest('/types');
    };

    /**
     * Get a resource which maps each organization's UID to its category label from the cache.
     *
     * @returns {Object} - a promise.
     */
    this.getOrgCategoryLabels = function() {
        return this.getCachedObject('org_categories.json');
    };

    this.getFinancialData = function(dateFrom, dateTo) {
        var def = $q.defer();
        var promises = [];

        var decisions;
        var promise = this.getRequest('/search?from_issue_date=' + this.toIsoDate(dateFrom)
                + '&to_issue_date=' + this.toIsoDate(dateTo)
                + '&type=Β.2.1&size=' + this.PAGE_SIZE).then(function(response) {
            decisions = response.data.decisions;
        });
        promises.push(promise);

        var organizations;
        promise = this.getCachedObject('organizations.json').then(function(response) {
            organizations = response.organizations;
        });
        promises.push(promise);

        $q.all(promises).then(function() {
            var output = [];

            var uniqueOrgs = $filter('unique')(decisions, 'organizationId');
            for(var i = 0; i < uniqueOrgs.length; i++) {
                var decisionsNo = 0;
                var outputDecisions = [];
                var expenseAmount = 0;
                for(var j = 0; j < decisions.length; j++) {
                    if(decisions[j].organizationId === uniqueOrgs[i].organizationId) {
                        decisionsNo++;
                        for(var k = 0; k < decisions[j].extraFieldValues.sponsor.length; k++) {
                            if(decisions[j].extraFieldValues.sponsor[k].expenseAmount) {
                                expenseAmount += decisions[j].extraFieldValues.sponsor[k]
                                        .expenseAmount.amount;
                                outputDecisions.push(decisions[j]);
                            }
                        }
                    }
                }

                var label;
                for(var j = 0; j < organizations.length; j++) {
                    if(organizations[j].uid === uniqueOrgs[i].organizationId) {
                        label = organizations[j].label;
                        break;
                    }
                }

                if(expenseAmount > 0) {
                    var duplicate = false;
                    for(var j = 0; j < output.length; j++) {
                        if(output[j].organizationLabel === label) {
                            output[j].expenseAmount += expenseAmount;
                            output[j].decisionsNo += decisionsNo;
                            duplicate = true;
                        }
                    }

                    if(!duplicate) {
                        output.push({
                            organizationId: uniqueOrgs[i].organizationId,
                            organizationLabel: label,
                            expenseAmount: expenseAmount,
                            decisions: outputDecisions
                        });
                    }
                }
            }

            output = $filter('orderBy')(output, 'expenseAmount', true);
            def.resolve(output);
        }).catch(function(error) {
            def.reject(error);
        });

        return def.promise;
    };

    this.getFinancialDataByEntity = function(dateFrom, dateTo, selectedOrg, selectedSponsor) {
        var def = $q.defer();
        var promises = [];

        var orgId;
        if(selectedOrg) {
            var orgPromise = this.getCachedObject('organizations.json').then(function(response) {
                for(var i = 0; i < response.organizations.length; i++) {
                    if(response.organizations[i].label === selectedOrg) {
                        orgId = response.organizations[i].uid;
                        break;
                    }
                }

                if(!orgId) {
                    def.reject('Organization not found');
                    return def.promise;
                }
            });
            promises.push(orgPromise);
        }

        if(selectedSponsor) {
            var sponsorPromise = this.getCachedObject('sponsors.json').then(function(response) {
                var found = false;
                for(var i = 0; i < response.length; i++) {
                    if(response[i].name === selectedSponsor) {
                        found = true;
                        break;
                    }
                }

                if(!found) {
                    def.reject('Sponsor not found');
                    return def.promise;
                }
            });
            promises.push(sponsorPromise);
        }

        var me = this;
        $q.all(promises).then(function() {
            var orgQuery = '';
            if(orgId) {
                orgQuery = '&org=' + orgId;
            }

            me.getRequest('/search?from_issue_date=' + me.toIsoDate(dateFrom)
                        + '&to_issue_date=' + me.toIsoDate(dateTo)
                        + '&type=Β.2.1&size=' + me.PAGE_SIZE + orgQuery).then(function(response) {

                var output = [];

                var decisions = response.data.decisions;
                var selectionDecisions = [];
                if(selectedSponsor) {
                    for(var i = 0; i < decisions.length; i++) {
                        for(var j = 0; j < decisions[i].extraFieldValues.sponsor.length; j++) {
                            if(decisions[i].extraFieldValues.sponsor[j].sponsorAFMName.name === selectedSponsor) {
                                selectionDecisions.push(response.data.decisions[i]);
                                break;
                            }
                        }
                    }
                }
                else {
                    selectionDecisions = response.data.decisions;
                }

                for(var i = 0; i < selectionDecisions.length; i++) {
                    var sum = 0;
                    for(var j = 0; j < selectionDecisions[i].extraFieldValues.sponsor.length; j++) {
                        sum += selectionDecisions[i].extraFieldValues.sponsor[j].expenseAmount.amount;
                    }

                    if(sum > 0) {
                        output.push({
                            date: selectionDecisions[i].issueDate,
                            expenseAmount: sum,
                            decision: selectionDecisions[i]
                        });
                    }
                }

                def.resolve(output);
            });
        }).catch(function(error) {
            def.reject(error);
        });

        return def.promise;
    };
}]);
