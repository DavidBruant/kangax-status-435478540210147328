'use strict';

const { Request } = require("sdk/request");
const { defer } = require('sdk/core/promise');

var BASE_URL = 'https://api.github.com/';

function makeOptionString(obj){
    return Object.keys(obj)
        .map( k => encodeURIComponent(k)+'='+encodeURIComponent( String(obj[k]) ) )
        .join('&');
}


module.exports = function(token){
    if(arguments.length === 0)
        throw new TypeError("Missing first argument (token)");
    if(typeof token !== 'string')
        throw new TypeError("token isn't a string ("+token === null ? 'null' : typeof token+")");

    var headers = {
        'User-Agent': 'https://github.com/DavidBruant/kangax-status-435478540210147328/',
        'Authorization': 'token '+token
    };
    
    
    return {
        testToken: function(){
            var def = defer();
                
            Request({
                url: BASE_URL+'users', // any url could work
                onComplete: function (response) {
                    if(response.status < 400) 
                        def.resolve(token); // 200 or 304 usually
                    else // 401
                        def.reject('fail '+token);
                },
                headers: headers
            }).get();

            return def.promise;
        },
        
        getLatestRepoIssues: function(repo){
            var def = defer();
            
            var options = makeOptionString({
                per_page: 100,
                sort: "created",
                direction: "desc"
            });
            
            Request({
                // implicitely fetch only open issues. Need to take closed issues into account
                url: BASE_URL+'repos/'+repo+'/issues'+'?'+options,
                onComplete: function (response) {
                    if(response.status >= 400)
                        def.reject(response.status); // TODO maybe provide more info about the error
                    else{
                        def.resolve(response.json);
                    }
                    
                },
                headers: headers
            }).get();

            return def.promise;
        },
        
        // issueNumber is the 'number', not the 'id'
        getIssueComments: function(repo, issueNumber){
            console.log('getIssueComments', repo, issueNumber);
            var def = defer();
            
            var options = makeOptionString({
                per_page: 30,
                sort: "created",
                direction: "asc" // oldest first
            });
            
            Request({
                // implicitely fetch only open issues. Need to take closed issues into account
                url: BASE_URL+'repos/'+repo+'/issues/'+issueNumber+'/comments'+'?'+options,
                onComplete: function (response) {
                    if(response.status >= 400)
                        def.reject(response.status); // TODO maybe provide more info about the error
                    else{
                        def.resolve(response.json);
                    }
                },
                headers: headers
            }).get();
            
            
            return def.promise;
        }
        
    }
    
}
    
    
