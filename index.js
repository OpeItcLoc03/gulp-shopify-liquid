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
        inheritExtension: false,
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

        if (file.data) {
            data = _.merge(file.data, data);
        }

		if (file.isStream()) {
			this.emit("error", new gutil.PluginError("gulp-shopify-liquid", "Stream content is not supported"));
			return callback();
		}

        var _this = this;

        var filePath = file.path;

		if (file.isBuffer()) {
            try {
                engine.parseAndRender(file.contents.toString(), data)
                    .then(function (output) {

                        file.contents = new Buffer(output);

                        // Replace extension with mentioned/default extension
                        // only if inherit extension flag is not provided(truthy)
                        if (!options.inheritExtension) {
                            file.path = gutil.replaceExtension(filePath, options.ext);
                        }
                        
                        _this.push(file);
                        callback();

                    });
            } catch (err) {
                this.emit("error", new gutil.PluginError("gulp-shopify-liquid", err, {fileName: filePath}));
                callback();
            }
        }
    }

    return through.obj(liquid);
};