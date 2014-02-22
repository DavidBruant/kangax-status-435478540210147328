"use strict";

var Request = require("sdk/request").Request;
var Widget = require("sdk/widget").Widget;
var Panel = require("sdk/panel").Panel;
var PageMod = require("sdk/page-mod").PageMod;

var data = require("sdk/self").data;

var storage = require("sdk/simple-storage").storage;

exports.main = function(){
    
    var pageMod; // TODO pageMod.destroy when token changes
    
    var tokenPanel = Panel({
        width: 600,
        height: 100,
        
        position: {
            top: 0,
            right: 0
        },
        
        contentURL: data.url('token.html'),
        contentScriptFile: [
            data.url('token.js')
        ],
        contentScriptWhen: "ready"
    });
    
    tokenPanel.on('error', function(err){
        console.log('tokenPanel error', err);
    });
    
    var githubWidget = Widget({
        id: "kang-4354",
        label: "enter personal token",
        content: "PR Time",
        width: 60,

        panel: tokenPanel
    });
    
    tokenPanel.port.on('test-token', token => {
        // send a dummy request (hits the quota a bit, but it's for a good cause)
        // https://api.github.com/repositories
        console.log('test-token', token);
        
        var req = Request({
            url: 'https://api.github.com/users',
            onComplete: function (response) {
                tokenPanel.port.emit('test-token-result', response.status === 200 ? token : 'fail '+token);
            },
            headers: {
                'Authorization': 'token '+token
            }
        }).get();
    });
    
    tokenPanel.port.on('persist-token', token => {
        storage.token = token;
        tokenPanel.hide();
        getReadyForGithubRepoPages(token);
    });
    
    function getReadyForGithubRepoPages(token){
        pageMod = PageMod({
            include: /^https:\/\/github\.com\/([^\/]+\/[^\/]+)\/?$/,
            contentScriptFile: data.url("github-response-time.js"),
            contentScriptWhen: "start"
        });
        
        pageMod.on('attach', worker => {
            var matches = worker.url.match(/^https:\/\/github\.com\/([^\/]+\/[^\/]+)\/?$/i);
            var repo;
            
            if(!Array.isArray(matches) || matches.length < 2)
                return;
            
            repo = matches[1];
            console.log('repo', repo);
            
            var req = Request({
                // implicitely fetch only open issues. Need to take closed issues into account
                url: 'https://api.github.com/repos/'+repo+'/issues?per_page=100',
                onComplete: function (response) {
                    console.log('issues', response)
                },
                headers: {
                    'Authorization': 'token '+token
                }
            }).get();
            
            // fetch relevant repo info
            // Likely comments too http://developer.github.com/v3/issues/comments/
            
        })
    }
    
    
    if(storage.token){
        getReadyForGithubRepoPages(storage.token);
    }
    else{ // no token stored. Ask one to user
        tokenPanel.show();
    }
};