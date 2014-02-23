"use strict";

/*
https://twitter.com/kangax/status/435478540210147328

"Would be nice if @github showed average response time on issues for each repo; OSS projects w. quick responses always look more promising"

"I'm talking about any activity (comment, status change, etc.) not resolutions. I have multi-year issues as well, but w. response."

- "What's response time? Time till being closed? Time till first comment?"
- "First comment. "Till closed" would cause more harm than good."

Open questions :
- Response from whom? could be anyone or repo collaborators. Choosing anyone
- How much time should be considered for issues without answers? Could be time-since-open or issues could be treated separatedly. Choosing separatedly
- Should all issues be considered in the average count (response time might vary over time)? Choosing first 100 open issues (for impl simplicity. can only get 100 issues per request and have to choose between open and closed).

Among open issues :
- % without response from anyone
- For those with a response, average response time from someone else than issue creator

*/

const { all } = require('sdk/core/promise');
var Widget = require("sdk/widget").Widget;
var Panel = require("sdk/panel").Panel;
var PageMod = require("sdk/page-mod").PageMod;

var data = require("sdk/self").data;

var storage = require("sdk/simple-storage").storage;

var Github = require('githubAPI');

var ONE_DAY = 24*60*60*1000; // ms

exports.main = function(){
    
    var pageMod; // TODO pageMod.destroy when token changes
    var gh;
    
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
        
        gh = new Github(token);
        gh.testToken()
            .then( token => tokenPanel.port.emit('test-token-result', token) ,
                   err => {
                        tokenPanel.port.emit('test-token-result', err);
                        gh = undefined;
                   }
            );
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
            
            var commentlessIssuesCount = 0;
            var issuesNb;
            
            console.time('average repo response time');
            
            gh.getLatestRepoIssues(repo)
                .then( issues => {
                    console.log('issues', issues);
                    issuesNb = issues.length;
                    
                    issues = issues.slice(0, 40); // refraining from making too many HTTP requests
                    
                    return all(issues.map( issue => {
                            var issueCreatorId;
                            var issueCreationDate;

                            if(issue.comments === 0) 
                                commentlessIssuesCount++;
                            else{
                                issueCreatorId = issue.user.id;
                                issueCreationDate = Date.parse(issue.created_at);

                                return gh.getIssueComments(repo, issue.number).then( comments => {
                                    // find first comment not from issue creator
                                    var firstComment = comments.find( c => c.user.id !== issueCreatorId );
                                    var firstCommentDate;

                                    if(firstComment){
                                        firstCommentDate = Date.parse(firstComment.created_at);
                                        
                                        // difference in days
                                        return Math.round((firstCommentDate - issueCreationDate)/ONE_DAY);
                                    }
                                    else
                                        commentlessIssuesCount++;
                                });
                            }
                        })
                    );
                    
                })
                .then(
                    delays => {
                        console.timeEnd('average repo response time');
                        delays = delays.filter(x => x !== undefined);
                        console.log('delays', delays);
                        console.log('stats', {
                            commentlessIssues: commentlessIssuesCount,
                            averageResponseTime: delays.reduce( (acc, curr) => {return acc+curr}, 0 )/delays.length
                        })
                        
                        worker.port.emit('repo-response-stats', {
                            commentlessIssues: commentlessIssuesCount,
                            averageResponseTime: delays.reduce( (acc, curr) => {return acc+curr}, 0 )/delays.length
                        })
                    },
                    err => console.log('err', err)
                );
            
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