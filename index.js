'use strict';

var _ = require('lodash');
var gutil = require('gulp-util');
var through = require('through2');
var Liquid = require('shopify-liquid');

/*
 * gulp-shopify-liquid
 * @param options.data {Object} - data that should be passed to files
 * @param options.filters {Object} - tags that should be passed to files
 * @param options.tags {Object} - tags that should be passed to files
**/
module.exports = function(options) {
    var defaults = {
        path: '.',
        ext: '.html',
        data: {}
    }
    options = _.defaultsDeep(options || {}, defaults);
    
    var engine = Liquid({
        root: options.path,
        extname: options.ext
    });
    
	if (options.filters && typeof options.filters == "object") {
		/* Register liquid filters prior to processing */
		Object.keys(options.filters).forEach(function (filter) {
            engine.registerFilter(filter, options.filters[filter]);
		});
	}

	if (options.tags && typeof options.tags == "object") {
		/* Register liquid tags prior to processing */
		Object.keys(options.tags).forEach(function (tag) {
            engine.registerTag(tag, options.tags[tag]);
		});
	}

	function liquid (file, enc, callback) {
        var data = _.cloneDeep(options.data);

		if (file.isNull()) {
			return callback();
		}

		if (file.isStream()) {
			this.emit("error",
				new gutil.PluginError("gulp-shopify-liquid", "Stream content is not supported"));
			return callback();
		}

		if (file.isBuffer()) {
            var template = engine.parse(file.contents.toString());
            var promise = engine.render(template, {name: 'alice'});
            promise.then(function (output) {
                file.contents = new Buffer(output);
                this.push(file);
                callback();
            }.bind(this), function (err) {
                new gutil.PluginError('gulp-shopify-liquid', 'Error during conversion');
            });
        }
    }

    return through.obj(liquid);
};