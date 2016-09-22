/* jshint node: true */
/* global describe, it, beforeEach */
'use strict';
var chai = require('chai');
var assert = chai.assert;
var fs = require('fs');
var m = require('../index');
var readManifest = require('../lib/readManifest');
var processManifest = require('../lib/processManifest');
var buildGlobs = require('../lib/buildGlobs');
var Asset = require('../lib/Asset');
var bower = require('bower');
var Q = require('q');
var mkdirp = require('mkdirp');
var _ = require('lodash');
var path = require('path');

var defaultTypes = {
    "scripts": {
        "pattern": "*.js"
    },
    "styles": {
        "pattern": "*.css"
    },
    "fonts": {
        "pattern": "*.{eot,otf,svg,ttc,ttf,woff,woff2}"
    },
    "images": {
        "pattern": "*.{jpg,png,gif}"
    }
}

function normalizeAll(files) {
    return _.map(files, function (f) {
        return path.normalize(f);
    });
}

function bowerSetup(bowerJson) {
    bowerJson = bowerJson || 'bower.json';
    var deferred = Q.defer();
    fs.writeFileSync('test/tmp/bower.json', fs.readFileSync('test/fixtures/' + bowerJson));
    bower.commands.prune().on('end', function () {
        bower.commands.install(null, null, { 'cwd': 'test/tmp/' }).on('end', function () {
            deferred.resolve();
        });
    });
    return deferred.promise;
}

describe('JSON Reading and Parsing', function () {
    it('should throw an error if the manifest cannot be found', function () {
        assert.throws(function () { readManifest('totally/bogus/file.json'); }, Error);
    });
    it('should throw an error if the manifest is not valid JSON', function () {
        assert.throws(function () { readManifest('test/fixtures/invalid.json'); }, SyntaxError);
    });
    it('should return an object if JSON is valid', function () {
        assert.isObject(readManifest('test/fixtures/manifest-v1.json'));
    });
});

describe('Processing the Manifest', function () {
    var manifest;
    it('should throw an error if the json file is missing the "assets" property', function () {
        assert.throws(function () {
            manifest = processManifest(readManifest('test/fixtures/manifest-missing.json'));
        }, Error, 'Manifest File Error: missing');
    });
    it('should throw an error if the json file is not a plain object', function () {
        assert.throws(function () {
            manifest = processManifest([{ 'lol': 'not valid' }]);
        }, Error, 'Manifest File Error: file seems');
    });
    it('should turn all "files" strings into arrays', function () {
        manifest = processManifest(readManifest('test/fixtures/manifest-mixed.json'));
        assert.isArray(manifest.resources.styles.assets['app.css'].files);
        assert.isArray(manifest.resources.scripts.assets['home.js'].files);
    });
    it('should append the source dir to all files arrays except external', function () {
        manifest = processManifest(readManifest('test/fixtures/manifest-v1.json'));
        assert.equal(manifest.resources.styles.assets['app.css'].files[0], 'assets/styles/main.less');
        assert.equal(manifest.resources.scripts.assets['noappend.js'].files[0], '../themedir/home.js');
    });
});

describe('Asset', function () {
    var asset = new Asset('app.js', {
        vendor: ['test.js'],
        files: ['test1.js']
    });
    var assetBare = new Asset('app.css', {
    });
    var assetVendor = new Asset('app.js', {
        vendor: ['assets/vendor1.js', 'assets/vendor2.js'],
        files: ['firstparty1.js', 'firstparty2.js']
    });
    it('should set properties correctly', function () {
        assert.equal(asset.type, 'js');
        assert.equal(assetBare.type, 'css');
        assert.sameMembers(asset.globs, [
            'test.js',
            'test1.js'
        ]);
        assert.sameMembers(assetBare.globs, []);
    });
    it('should put globs in order', function () {
        assert.equal(asset.globs[0], 'test.js');
        assert.equal(asset.globs[1], 'test1.js');
        assert.equal(assetVendor.globs[0], 'assets/vendor1.js');
        assert.equal(assetVendor.globs[1], 'assets/vendor2.js');
        assert.equal(assetVendor.globs[2], 'firstparty1.js');
        assert.equal(assetVendor.globs[3], 'firstparty2.js');
    });
    it('should prependGlobs correctly', function () {
        asset.prependGlobs('new.js');
        assert.sameMembers(asset.globs, [
            'new.js',
            'test.js',
            'test1.js'
        ]);
    });
    it('should parse the type correctly', function () {
        assert.equal(Asset.parseType('app.css'), 'css');
        assert.equal(Asset.parseType('app.js'), 'js');
        assert.equal(Asset.parseType('app.min.1.11.1.js'), 'js');
    });
});

describe('Glob building', function () {
    var manifest;
    var mockBowerFiles = require('./fixtures/sampleMainBowerFiles.json').files;
    mockBowerFiles = normalizeAll(mockBowerFiles);
    var mockTypesFiles = require('./fixtures/types.json').files;
    mockTypesFiles = normalizeAll(mockTypesFiles);
    var globInstance = new buildGlobs(defaultTypes, mockBowerFiles);
    describe('filtering by package', function () {
        it('should get particular package files by string', function () {
            var jq = buildGlobs.prototype.filterByPackage(mockBowerFiles, 'jquery');
            assert.isArray(jq);
            assert.sameMembers(jq, [
                path.normalize("/asset-builder/bower_components/jquery/dist/jquery.js")
            ]);
        });
        it('should get particular package files by array', function () {
            var jq = buildGlobs.prototype.filterByPackage(mockBowerFiles, ['jquery']);
            assert.isArray(jq);
            assert.sameMembers(jq, [
                path.normalize("/asset-builder/bower_components/jquery/dist/jquery.js")
            ]);
        });
    });

    describe('rejecting by package', function () {
        it('should return everything except specified packages', function () {
            var rejected = buildGlobs.prototype.rejectByPackage(normalizeAll([
                '/bogus/bower_components/jquery/main.js',
                '/bogus/bower_components/mootools/main.js'
            ]), ['jquery']);
            assert.sameMembers(rejected, normalizeAll([
                '/bogus/bower_components/mootools/main.js'
            ]));
        });
    });

    describe('filtering by type', function () {
        it('should get fonts', function () {
            assert.sameMembers(globInstance.filterByType(mockBowerFiles, 'fonts'), normalizeAll([
                "/asset-builder/bower_components/bootstrap/fonts/glyphicons-halflings-regular.eot",
                "/asset-builder/bower_components/bootstrap/fonts/glyphicons-halflings-regular.svg",
                "/asset-builder/bower_components/bootstrap/fonts/glyphicons-halflings-regular.ttf",
                "/asset-builder/bower_components/bootstrap/fonts/glyphicons-halflings-regular.woff"
            ]));
        });
        it('should get images', function () {
            assert.sameMembers(globInstance.filterByType(mockBowerFiles, 'images'), normalizeAll([
                "/Some/Path/images/imagesGIF.gif",
                "/Some/Path/images/imagesPNG.png",
                "/Some/Path/images/imagesJPG.jpg"
            ]));
        });
        it('should match woff2', function () {
            assert.sameMembers(globInstance.filterByType(mockTypesFiles, 'fonts'), normalizeAll([
                "/asset-builder/bower_components/bootstrap/fonts/glyphicons-halflings-regular.eot",
                "/asset-builder/bower_components/bootstrap/fonts/glyphicons-halflings-regular.svg",
                "/asset-builder/bower_components/bootstrap/fonts/glyphicons-halflings-regular.ttf",
                "/asset-builder/bower_components/bootstrap/fonts/glyphicons-halflings-regular.woff",
                "/asset-builder/bower_components/bootstrap/fonts/glyphicons-halflings-regular.woff2",
                "/asset-builder/bower_components/bootstrap/fonts/glyphicons-halflings-regular.otf"
            ]));
        });
        it('should get javascript', function () {
            assert.sameMembers(globInstance.filterByType(mockBowerFiles, 'scripts'), normalizeAll([
                "/asset-builder/bower_components/jquery/dist/jquery.js",
                "/asset-builder/bower_components/bootstrap/js/transition.js",
                "/asset-builder/bower_components/bootstrap/js/alert.js",
                "/asset-builder/bower_components/bootstrap/js/button.js",
                "/asset-builder/bower_components/bootstrap/js/carousel.js",
                "/asset-builder/bower_components/bootstrap/js/collapse.js",
                "/asset-builder/bower_components/bootstrap/js/dropdown.js",
                "/asset-builder/bower_components/bootstrap/js/modal.js",
                "/asset-builder/bower_components/bootstrap/js/tooltip.js",
                "/asset-builder/bower_components/bootstrap/js/popover.js",
                "/asset-builder/bower_components/bootstrap/js/scrollspy.js",
                "/asset-builder/bower_components/bootstrap/js/tab.js",
                "/asset-builder/bower_components/bootstrap/js/affix.js",
            ]));
        });
        it('should get css', function () {
            assert.sameMembers(globInstance.filterByType(mockBowerFiles, 'styles'), normalizeAll([
                "/asset-builder/bower_components/bootstrap/bogus/file.css"
            ]));
        });
    });

    describe('output globs', function () {
        var assets = {
            "scripts": {
                "pattern": "*.js",
                "assets": {
                    "app.js": {
                        files: ['path/to/script.js']
                    }
                }
            },
            "fonts": {
                "pattern": "*.{ttf,woff,woff2,otf,svg}",
                "assets": {
                    "/": {
                        files: ['font/path/*'],
                        bower: ['lol']
                    }
                }
            },
            "images": {
                "pattern": "*.{png,jpg,gif}",
                "assets": {
                    "/": {
                        files: ['image/path/*'],
                        bower: ['lol']
                    }
                }
            }
        };
        var bower = [
            '/bower_components/lol/fonts/test.woff',
            '/bower_components/lol/fonts/test.woff2',
            '/bower_components/lol/images/imageJPG.jpg',
            '/bower_components/lol/images/imagePNG.png',
            '/bower_components/lol/images/imageGIF.gif'
        ];
        var buildGlob = new buildGlobs(assets, bower);

        it('should output a fonts glob', function () {
            assert.sameMembers(buildGlob.globs.fonts[0].globs, [
                '/bower_components/lol/fonts/test.woff',
                '/bower_components/lol/fonts/test.woff2',
                'font/path/*'
            ]);
        });
        it('should output an images glob', function () {
            assert.sameMembers(buildGlob.globs.images[0].globs, [
                '/bower_components/lol/images/imageJPG.jpg',
                '/bower_components/lol/images/imagePNG.png',
                '/bower_components/lol/images/imageGIF.gif',
                'image/path/*'
            ]);
        });
        it('should output a bower glob', function () {
            assert.sameMembers(buildGlob.globs.bower, bower);
        });
    });

    describe('excluded bower assets from main', function () {
        it('should build a list of bower packages to exclude', function () {
            var assets = {
                "random.js": {
                    bower: ['jquery']
                },
                "other.js": {
                    bower: ['bootstrap', 'bogus']
                }
            };
            var exclude = buildGlobs.prototype.bowerExclude(assets);
            assert.sameMembers(exclude, [
                'jquery',
                'bootstrap',
                'bogus'
            ]);
        });
    });

    describe('getting output files', function () {
        var mockBower = normalizeAll([
            "/asset-builder/bower_components/jquery/dist/jquery.js",
            "/asset-builder/bower_components/bootstrap/js/transition.js",
            "/asset-builder/bower_components/bootstrap/js/alert.js",
        ]);
        it('should add everything except jquery if defined elsewhere', function () {
            var expected = [
                {
                    type: 'js',
                    outputName: 'app.js',
                    globs: [
                        path.normalize("/asset-builder/bower_components/bootstrap/js/transition.js"),
                        path.normalize("/asset-builder/bower_components/bootstrap/js/alert.js"),
                        "path/to/script.js"
                    ]
                },
                {
                    type: 'js',
                    outputName: 'jquery.js',
                    globs: [
                        path.normalize("/asset-builder/bower_components/jquery/dist/jquery.js"),
                    ]
                }
            ];
            var buildGlob = new buildGlobs({
                "scripts": {
                    "pattern": "*.js",
                    "assets": {
                        "app.js": {
                            files: ['path/to/script.js'],
                            main: true
                        },
                        "jquery.js": {
                            bower: ['jquery']
                        }
                    }
                }
            }, mockBower);

            assert.sameMembers(buildGlob.globs.scripts[0].globs, expected[0].globs, 'app.js not the same');
            assert.sameMembers(buildGlob.globs.scripts[1].globs, expected[1].globs, 'jquery not the same');
        });
    });
});

describe('Integration Tests', function () {
    describe('manifests', function () {
        beforeEach(function (done) {
            this.timeout(30e3);
            mkdirp('test/tmp', function () {
                bowerSetup().then(function () {
                    done();
                });
            });
        });

        describe('sage manifest', function () {
            it('default sage manifest', function () {
                var output = m('test/fixtures/sage.json', {
                    paths: {
                        bowerDirectory: 'test/tmp/bower_components',
                        bowerJson: 'test/tmp/bower.json'
                    }
                });

                assert.lengthOf(output.globs.scripts, 3);
                assert.lengthOf(output.globs.styles, 1);

                // app.css
                assert.equal(output.globs.styles[0].type, 'css');
                assert.equal(output.globs.styles[0].outputName, 'app.css');
                assert.lengthOf(output.globs.styles[0].globs, 1);
                assert.include(output.globs.styles[0].globs[0], 'main.less');

                // app.js
                assert.equal(output.globs.scripts[0].type, 'js');
                assert.equal(output.globs.scripts[0].outputName, 'app.js');
                assert.include(output.globs.scripts[0].globs, 'assets/scripts/**/*');
                _.forEach(output.globs.scripts[0].globs, function (s) {
                    assert.notInclude(s, 'jquery');
                    assert.notInclude(s, 'modernizr');
                });

                // jquery.js
                assert.equal(output.globs.scripts[1].type, 'js');
                assert.equal(output.globs.scripts[1].outputName, 'jquery.js');
                assert.lengthOf(output.globs.scripts[1].globs, 1);
                assert.include(output.globs.scripts[1].globs[0], 'jquery.js');

                // modernizr.js
                assert.equal(output.globs.scripts[2].type, 'js');
                assert.equal(output.globs.scripts[2].outputName, 'modernizr.js');
                assert.lengthOf(output.globs.scripts[2].globs, 1);
                assert.include(output.globs.scripts[2].globs[0], 'modernizr.js');

                // has images
                assert.sameMembers(output.globs.images[0].globs, [
                    'assets/images/**/*'
                ]);
            });
        });


        describe('extremely verbose manifest', function () {
            it('extremely verbose manifest', function () {
                var output = m('test/fixtures/verbose.json', {
                    paths: {
                        bowerDirectory: 'test/tmp/bower_components',
                        bowerJson: 'test/tmp/bower.json'
                    }
                });

                var globs = output.globs;

                assert.sameMembers(_.find(globs.scripts, { outputName: 'external.js' }).globs, [
                    '../../noappend.js'
                ]);

                assert.sameMembers(_.find(globs.scripts, { outputName: 'vendor.js' }).globs, [
                    '../../plugin/script.js',
                    'assets/scripts/somescript.js'
                ]);

                assert.equal(_.find(globs.scripts, { outputName: 'vendor.js' }).globs[0], '../../plugin/script.js');
                assert.equal(_.find(globs.scripts, { outputName: 'vendor.js' }).globs[1], 'assets/scripts/somescript.js');

            });
        });
    });
});

describe('convenience methods', function () {
    describe('getProjectGlobs', function () {
        it('should return project JS', function () {
            var proj = m.Manifest.prototype.getProjectGlobs.call({
                resources: {
                    "scripts": {
                        "assets": {
                            "app.js": {
                                files: [
                                    "app.js",
                                    "script.js"
                                ]
                            },
                            "cool.js": {
                                files: [
                                    "cool1.js",
                                    "cool2.js"
                                ]
                            }
                        }
                    }
                }
            });

            assert.isArray(proj.scripts);
            assert.sameMembers(proj.scripts, [
                'app.js',
                'script.js',
                "cool1.js",
                "cool2.js"
            ]);
        });
        it('should return project CSS', function () {
            var proj = m.Manifest.prototype.getProjectGlobs.call({
                resources: {
                    "styles": {
                        "assets": {
                            "app.css": {
                                files: [
                                    "app.less",
                                    "styles.scss"
                                ]
                            }
                        }
                    }
                }
            });
            assert.sameMembers(proj.styles, [
                "app.less",
                "styles.scss"
            ]);
        });
    });
    describe('getAsset', function () {
        var globs = {
            globs: {
                css:
                [{
                    type: 'css',
                    resourceName: 'styles',
                    outputName: 'main.css',
                    globs: []
                },
                    {
                        type: 'css',
                        resourceName: 'styles',
                        outputName: 'editor-style.css',
                        globs: []
                    }],
                js: [
                    {
                        type: 'js',
                        resourceName: 'scripts',
                        outputName: 'script.js',
                        globs: [
                            'class.js',
                            'important.js'
                        ]
                    },
                    {
                        type: 'js',
                        resourceName: 'scripts',
                        outputName: 'test.js',
                        globs: [
                            'class.js',
                            'important.js'
                        ]
                    }
                ],
                images: [
                    {
                        type: 'directory',
                        resourceName: 'images',
                        outputName: '/',
                        globs: [
                            'images/**/*'
                        ]
                    }
                ]
            }
        };
        it('should get a css asset by name', function () {
            var css = m.Manifest.prototype.getResourceByOutputName.call(globs, 'main.css');
            var js = m.Manifest.prototype.getResourceByOutputName.call(globs, 'test.js');
            var imgs = m.Manifest.prototype.getResourceByOutputName.call(globs, 'images/');
            assert.equal('main.css', css.outputName);
            assert.equal('test.js', js.outputName);
        });
    });
    describe('foreach asset', function () {
        it('should loop through the assets', function () {
            var count = 0;
            m.Manifest.prototype.forEachAsset.call({
                globs: {
                    scripts: [
                        {
                            type: 'js',
                            resourceName: 'scripts',
                            outputName: 'script.js',
                            globs: [
                                'class.js',
                                'important.js'
                            ]
                        },
                        {
                            type: 'js',
                            resourceName: 'scripts',
                            outputName: 'test.js',
                            globs: [
                                'class.js',
                                'important.js'
                            ]
                        }
                    ]
                }
            }, 'scripts', function (value) {
                count += 1;
                assert.equal(value.type, 'js');
                assert.sameMembers(value.globs, [
                    'class.js',
                    'important.js'
                ]);
            });
            assert.equal(count, 2);
        });
    });
});
