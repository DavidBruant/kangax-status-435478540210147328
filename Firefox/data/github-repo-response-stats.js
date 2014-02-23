'use strict';

var ISSUES_LI_SELECTOR = 'ul.sunken-menu-group li[aria-label="Issues"]';

/*
{
    issuesConsidered: issuesNb,
    commentlessIssues: commentlessIssuesCount,
    responseTimes: delays
}

*/

var ONE_DAY = 24*60*60*1000; // ms

self.port.on('repo-response-stats', stats => {
    console.log('integrate stats to content', stats);
    
    var responseTimes = stats.responseTimes;
    
    // Unlikely race condition: the document might not be ready yet (and so the following code might fail)
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