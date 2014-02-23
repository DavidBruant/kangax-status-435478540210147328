'use strict';

var ISSUES_LI_SELECTOR = 'ul.sunken-menu-group li[aria-label="Issues"]';

var documentReadyP = new Promise( resolve => {
    document.addEventListener('DOMContentLoaded', function listener(){
        resolve(document);
        document.removeEventListener('DOMContentLoaded', listener);
    });
});

var ONE_DAY = 24*60*60*1000; // ms

self.port.on('repo-response-stats', stats => {
    /*
    {
        issuesConsidered: issuesNb,
        commentlessIssues: commentlessIssuesCount,
        responseTimes: delays
    }
    */
    console.log('integrate stats to content', stats);
    
    var responseTimes = stats.responseTimes;
    
    documentReadyP.then(document => {
        var issuesLi = document.body.querySelector(ISSUES_LI_SELECTOR);
        if(!issuesLi)
            throw new Error('No element matching ('+ISSUES_LI_SELECTOR+'). No idea where to put the results :-(');

        var responseTimeStatsDiv = document.createElement('div');
        responseTimeStatsDiv.classList.add('response-time-stats');

        var commentLessIssuesPercent = (stats.commentlessIssues/stats.issuesConsidered)*100;
        var averageResponseTime = responseTimes.reduce( (acc, curr) => {return acc+curr}, 0 )/responseTimes.length;
        var averageResponseDays = averageResponseTime/ONE_DAY;

        responseTimeStatsDiv.innerHTML =
            '<h1>Over the latest '+stats.issuesConsidered+' open issues</h1>' +
            '<span>Commentless: '+commentLessIssuesPercent.toFixed(1)+'%</span>'+
            '<span>Average response time: '+ averageResponseDays.toFixed(1) + ' days</span>';

        issuesLi.appendChild(responseTimeStatsDiv);       
    })
    
    
})