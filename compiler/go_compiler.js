var fs   = require("fs");
var http = require("http");
var _    = require("../vendor/underscore");

GoCompiler = module.exports = function (fileContents, contentLength) {
    this.program = fileContents;
    this.contentLength = contentLength;
};

GoCompiler.compile = function (file) {
    console.log('STARTING...');
    var fileContents  = fs.readFileSync(file, 'utf-8'),
        contentLength = fs.statSync(file).size;
    (new GoCompiler(fileContents, contentLength)).post();
};

_.extend(GoCompiler.prototype, {
    post: function () {
        console.log('SENDING COMPILE REQUEST');
        var client = http.createClient(80, 'golang.org');
        var request = client.request('POST', '/compile?output=json', {
            'host': 'golang.org',
            'Content-Length': ''+this.contentLength
        });
        request.write(this.program, 'utf-8');
        request.end();
        
        this._compileTimer = +new Date();
        request.on('response', _.bind(this.receiveResponse, this));
    },

    receiveResponse: function (response) {
        this.status = response.statusCode;
        response.setEncoding('utf8');
        response.on('data', _.bind(this.receiveData, this));
    },

    receiveData: function (resBody) {
        var data = JSON.parse(resBody);
        var timer = +new Date() - this._compileTimer;
        
        console.log("COMPILE STATUS: " + this.status + " TIME: " + timer + "ms");
        if (data.compile_errors !== "") {
            console.log("COMPILE ERRORS");
            console.log(data.compile_errors);
        } else {
            console.log('OUTPUT');
            console.log('------');
            console.log(data.output);
        }
    }
});