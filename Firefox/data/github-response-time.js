'use strict';

self.port.on('response-time-data', data => {
    console.log('integrate data to content', data);
})