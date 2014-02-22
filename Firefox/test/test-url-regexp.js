// regexp to match github repo URLs
var r = /^https:\/\/github\.com\/([^\/]+\/[^\/]+)\/?$/i; // check on http://www.regexper.com to be sure

var passes = [
    'https://github.com/DavidBruant/OoI',
    'https://github.com/DavidBruant/OoI/',
    'https://github.com/DavidBruant/kangax-status-435478540210147328',
    'https://github.com/mathiasbynens/String.prototype.repeat'
];

var fails = [
    'DavidBruant/OoI',
    'DavidBruant/kangax-status-435478540210147328',
    'mathiasbynens/String.prototype.repeat',
    'https://github.com/DavidBruant/OoI/issues',
    'https://github.com/DavidBruant/',
    'https://yo.lol/DavidBruant/OoI',
];
    
console.log('passes', passes.every(function(s){
    return s.match(r);
}) ? 'ok' : 'ko');
console.log('fails', fails.every(function(s){
    return !s.match(r);
}) ? 'ok' : 'ko');