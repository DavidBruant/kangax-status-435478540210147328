'use strict';

var ok = document.body.querySelector('button[type="submit"]');

var input = document.body.querySelector('input[type="text"]');
input.focus();

ok.addEventListener('click', e => {
    var token = input.value;
    console.log('input token', token);
    if(!token || token.length <= 1)
        return; // ignore
    console.log('input token', token);
    // test the token
    self.port.emit('test-token', token);
    
    // add a spinner
});

input.addEventListener('input', e => { document.body.querySelector('.error').setAttribute('hidden', 'hidden'); })

self.port.on('test-token-result', result => {
    var inputToken = input.value;
    
    // remove spinner
    
    // parent context sends back the token if it's valid and whatever else otherwise
    if(result === inputToken){
        self.port.emit('persist-token', result);
    }
    else{
        // can happen either if the token is invalid or the user change the input field
        document.body.querySelector('.error').removeAttribute('hidden');
    }
})