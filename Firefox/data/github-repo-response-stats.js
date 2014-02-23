'use strict';

self.port.on('repo-response-stats', data => {
    console.log('integrate data to content', data);
})