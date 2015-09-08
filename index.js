var jsdom = require("jsdom");
var _string = require('underscore.string');
var fs = require('fs');

var DEFAULT_PAGE = '<html><head></head><body></body></html>';

exports.onPage = function(testFunc, content) {
    if (!content) {
        content = DEFAULT_PAGE;
    } else {
        content = _string.trim(content);
        if (!(_string.startsWith(content, '<') && _string.endsWith(content, '>'))) {
            var builder = global.jenkinsBuilder;
            
            // This isn't markup, so lets see can we load it as a test resource.
            var basePath = process.cwd() + '/' + builder.tests();
            var path = basePath + '/' + content;
            
            builder.logInfo("Loading test content from fs resource '" + path + "'.");
            if (fs.existsSync(path)) {
                content = fs.readFileSync(path, 'utf-8');
            } else {
                builder.logInfo("fs resource '" + path + "' doesn't exist. Will pass 'content' as is to jsdom.");
            }
        }
    }
    jsdom.env(content, [],
        function (errors, window) {
            if (!window.navigator) {
                window.navigator = {
                    userAgent: 'JasmineTest'
                };
            }
            require("window-handle").setWindow(window);
            
            // A new "window" instance is created for each test, so we need to clear anything
            // that could be created from that, forcing recreate for the new window instance.
            require("jquery-detached-2.1.4").clearSharedJQuery();
            require("jqueryui-detached-1.11").clear();
            require("bootstrap-detached-3.3").clear();
            
            testFunc();
        }
    );    
};

exports.requireSrcModule = function(moduleName) {
    function tryModule(inDir) {
        var path = process.cwd() + '/' + inDir + '/' + moduleName;
        if (!fs.existsSync(path)) {
            path += '.js';
            if (!fs.existsSync(path)) {
                return;
            }
        }
        return require(path);        
    }
    
    var theModule = tryModule('');
    if (theModule) {
        return theModule;
    }    
    return tryModule(global.jenkinsBuilder.src());
}