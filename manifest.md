
# asset-builder Manifest Specification
Heavily based on [Manifest Specification from austinpray](https://github.com/austinpray/asset-builder/blob/master/help/spec.md)

## JSON Serialization

### Examples

Following is a simple, minimal example of a `manifest`:

```json
{
    "resources": {
        "scripts": {
            "pattern": "*.js",
            "assets": {
                "app.js": {
                    "files": [
                        "scripts/**/*",
                        "scripts/main.js"
                    ],
                    "main": true
                },
                "modernizr.js": {
                    "bower": ["modernizr"]
                }
            }
        },
        "styles": {
            "pattern": "*.{css,less,styl,scss}",
            "assets": {
                "main.css": {
                    "files": [
                        "styles/main.less"
                    ],
                    "main": true
                }
            }
        }
    }
}
```

A more extensive `manifest.json` follows.

```json
{
    "resources": {
        "scripts": {
            "pattern": "*.js",
            "assets": {
                "app.js": {
                    "files": [
                        "scripts/services/**/*.js",
                        "scripts/controllers/**/*.js",
                        "scripts/directives/**/*.js",
                        "scripts/main.js"
                    ],
                    "vendor": [
                        "../../plugins/example-plugin/assets/plugin.js"
                    ],
                    "main": true
                },
                "homepage.js": {
                    "files": [
                        "custom-dir/homepage.js"
                    ],
                    "external": true,
                    "bower": ["slick-carousel"]
                },
                "jquery.js": {
                    "bower": ["jquery"]
                },
                "modernizr.js": {
                    "bower": ["modernizr"]
                }
            }
        },
        "styles": {
            "pattern": "*.{css,scss,styl,less}",
            "assets": {
                "main.css": {
                    "files": "styles/main.less",
                    "vendor": [
                        "../../plugins/example-plugin/assets/style.css"
                    ],
                    "main": true
                }
            }
        },
        "fonts": {
            "pattern": "*.{eot,otf,svg,ttc,ttf,woff,woff2}",
            "assets": {
                "/": {
                    "files": [
                        "fonts/**/*"
                    ]
                }
            }
        },
        "images": {
            "pattern": "*.{jpg,png,gif}",
            "assets": {
                "/": {
                    "files": [
                        "images/**/*"
                    ]
                }
            }
        }
    }
}
```

- In addition to containing more resources, the example contains optional properties such as `config.paths`.
- The directory where the compiled files are output has been changed to `build/`.
- The `app.js` asset is pulling in a vendor file from a directory outside the project directory.
- The `homepage.js` asset has specified an `external` as `true`. This means it will expect to find `custom-dir/homepage.js` and not `assets/custom-dir/homepage.js`.
- `homepage.js` has also specified that it requires `slick-carousel` as a bower dependency. In this case `slick-carousel` will be excluded from being automatically included in `app.js` and will be included in `homepage.js`.
- `main.css` in this case only has one file, so its `files` property can optionally be defined as a string.
- A `fonts` and `images` resource type has been specified. As its asset files won't be combined/concatenated, the output `/` specifies the root of the resource type distribution path.

### Defaults

```json
{
	"config": {
	    "paths": {
	        "source": "assets/",
	        "dist": "dist/",
	        "bowerDirectory": "bower_components/",
	        "bowerJson": "bower.json"
	    }
	},
	"resources": {}
}

```

### `manifest.json` Serialization

<table>
  <thead>
    <tr>
      <th>Property</th>
      <th>Value</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>resources</td>
      <td><a href="#serialization-resource-type">Resource Type</a></td>
      <td>Defines project’s resource types by listing the inputs as <a href="#serialization-resource-type">Resource Type</a> objects. A manifest MUST contain a "resources" property.</td>
    </tr>
    <tr>
      <td>config</td>
      <td>JSON [RFC4627] Object</td>
      <td>An object containing arbitrary configuration values as properties. A manifest MAY contain a "config" property.</td>
    </tr>
    <tr>
      <td>config.paths</td>
      <td><a href="#serialization-paths">Paths</a></td>
      <td>Defines a project’s input, output, 'bower_components/' and 'bower.json' locations. A manifest MAY contain a "paths" property.</td>
    </tr>
  </tbody>
</table>

### Resource Type Serialization <a name="serialization-resource-type"></a>

<table>
  <thead>
    <tr>
      <th>Property</th>
      <th>Value</th>
      <th>Description</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>{{NAME}}</td>
      <td><a href="#serialization-resource">Resource</a></td>
      <td>Defines project’s resource type files by listing the inputs as <a href="#serialization-resource">Resource</a> objects. A manifest MAY contain one or more resource types.</td>
    </tr>
  </tbody>
</table>

### Resource Serialization <a name="serialization-resource"></a>

<table>
  <thead>
    <tr>
      <th>Property</th>
      <th>Value</th>
      <th>Description</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>pattern</td>
      <td>String</td>
      <td>
        Defines the pattern in glob format to match a certain file type related to the current resource type.
      </td>
    </tr>
    <tr>
      <td>assets</td>
      <td>JSON [RFC4627] Object</td>
      <td>
	      Defines project’s output files of the current resource type by listing the inputs as <a href="#serialization-asset">Asset</a> objects. A resource type MUST contain an "asset" property.
      </td>
    </tr>
  </tbody>
</table>

### Asset Serialization <a name="serialization-asset"></a>

<table>
  <thead>
    <tr>
      <th>Property</th>
      <th>Value</th>
      <th>Description</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>files</td>
      <td>JSON [RFC4627] Array of Strings <strong>OR</strong> String</td>
      <td>
        Describes a list of file paths to local project files in <a
        href="#footnotes-globs">glob format</a>. An Asset MAY contain a
        "files" property. These are generally first-party project files. You
        can run all of your linters and styleguide checkers on these files. By
        default `config.path.source` will be prepended to each glob in this collection.
        To turn this behavior off, one sets the `external` property to true.
      </td>
    </tr>
    <tr>
      <td>vendor</td>
      <td>JSON [RFC4627] Array of Strings <strong>OR</strong> String</td>
      <td>
        Describes a list of file paths to vendored project files in <a
        href="#footnotes-globs">glob format</a>. An Asset MAY contain a
        "vendor" property. Generally you should treat these dependencies as
        third-party code. That means you should not run linters and styleguide
        checkers on these files.
      </td>
    </tr>
    <tr>
      <td>bower</td>
      <td>JSON [RFC4627] Array of Strings <strong>OR</strong> String</td>
      <td>Describes a list of bower package names to be included in that asset. An Asset MAY have a "bower" property.</td>
    </tr>
    <tr>
      <td>main</td>
      <td>boolean</td>
      <td>Describes whether or not all of the bower dependencies will automatically be included in this Asset. An Asset MAY have a "main" property.</td>
    </tr>
    <tr>
      <td>external</td>
      <td>boolean</td>
      <td>
        Describes whether or not the source (`config.path.source`) directory will be
        prepended to each glob in the "files" property. An Asset MAY have an
        "external" property. The external property should be considered `false`
        by default.
      </td>
    </tr>
  </tbody>
</table>

### Paths Serialization <a name="serialization-paths"></a>

<table>
  <thead>
    <tr>
      <th>Property</th>
      <th>Value</th>
      <th>Description</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>source</td>
      <td>JSON [RFC4627] String</td>
      <td>Describes the base location of a project’s asset folder. This will be prepended to all Asset "file" globs unless `external: true` is specified. The "source" property MUST have a trailing slash. Paths MAY have a "source" property.</td>
    </tr>
    <tr>
      <td>dist</td>
      <td>JSON [RFC4627] String</td>
      <td>Describes the base location of a project’s target build folder. Paths MAY have a "dist" property.</td>
    </tr>
    <tr>
      <td>bowerDirectory</td>
      <td>JSON [RFC4627] String</td>
      <td>Describes the location of a project's bower dependencies directory. Paths MAY have a "bowerDirectory" property.</td>
    </tr>
    <tr>
      <td>bowerJson</td>
      <td>JSON [RFC4627] String</td>
      <td>Describes the location a project's bower.json. Paths MAY have a "bowerJson" property.</td>
    </tr>
  </tbody>
</table>

# Footnotes

It is possible to append other attributes to any manifest's `json object` as it can be seen in the [phase][] automated asset workflow.

## See Also

### Globs <a name="footnotes-globs"></a>

* `man bash` (Search for "Pattern Matching")
* `man 3 fnmatch`
* `man 5 gitignore`
* [minimatch][]

## References

\[RFC4627\] Crockford, D., “The application/json Media Type for JavaScript Object Notation (JSON),” July 2006.


[RFC2119]: https://www.ietf.org/rfc/rfc2119.txt
[RFC4627]: http://www.ietf.org/rfc/rfc4627.txt
[glob]: https://github.com/isaacs/node-glob
[minimatch]: https://github.com/isaacs/minimatch
[phase]: https://github.com/kaisermann/phase
