# Travis Monitor #

## About ##

Travis Monitor is a little web-app which allows you to monitor multiple
projects from [Travis-CI](http://travis-ci.org). It'll show you the current
status of the builds, as well as some trendlines for whether the projects are
keeping the builds green.  It's mostly Javascript, using [Backbone](http://backbonejs.org/) for handling
the data and UI.

*NB*: Using this means you won't see the ads for sponsors on the Travis site,
 so you should go make a donation.  They're providing a great service, and it
 would be a shame if it disappeared because people weren't supporting it.

## Using Travis Monitor ##

You can host the code yourself, or visit the hosted version at
[http://paulswartz.github.com/travis-monitor/](http://paulswartz.github.com/travis-monitor/).
All the data is stored in your browser (using localStorage).

### Tests ###

There are some unittests for the functionality in the `tests/` directory.  You can run them yourself at [http://paulswartz.github.com/travis-monitor/test/](http://paulswartz.github.com/travis-monitor/test/).

## Contact ##

You can reach me (Paul Swartz) via [e-mail](mailto:paulswartz+travismonitor at gmail dot com) or on Twitter [@paulswartz](http://twitter.com/paulswartz).
