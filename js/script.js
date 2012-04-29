/* Author: Paul Swartz <http://paulswartz.net/.

*/


$(document).ready(function() {

    var storePrefix = 'travis-';
    var urlPrefix = 'http://travis-ci.org/';
    var urlSuffix = '.json?callback=?';
    if (typeof QUnit !== 'undefined') {
        storePrefix = 'qunit-';
        urlPrefix = 'data/';
        urlSuffix = '.json';
    }
    function travisURL(middle) {
        return urlPrefix + middle + urlSuffix;
    };

    var Project = Backbone.Model.extend({
        defaults: {
            'slug': 'blank project',
            'last_build_status': -1,
            'builds': null,
            'branches': null
        },
        _travisJSON: function(extra, success) {
            var url = travisURL(this.get('slug') + extra);
            var that = this;
            function wrapper(data) {
                return success.call(that, data);
            }
            return $.getJSON(url, wrapper);
        },
        loadFromTravis: function() {
            xhr = this._travisJSON('', this.save);
            this._travisJSON('/builds', function(data) {
                builds = this.get('builds') || {};
                branches = this.get('branches') || {};
                _.each(data, function(build) {
                    branch_builds = branches[build.branch] || {};
                    branch_builds[build.id] = builds[build.id] = build;
                    branches[build.branch] = branch_builds;
                });
                this.save({builds: builds,
                           branches: branches,
                           num_builds: _.size(builds)});
            });
            return xhr;
        },
        trendData: function(branch) {
            return _.chain(this.lastBuild(branch, 10)).map(
                function(build) {
                    return build.result ? -1 : 1;
                }).value();
        },
        lastBuild: function(branch, count) {
            if (typeof count === 'undefined') {
                count = 1;
            }
            var builds = null;
            if (typeof branch === 'undefined') {
                builds = this.get('builds');
            } else {
                builds = this.get('branches')[branch];
            }
            var last = _.chain(builds).values().sortBy(function(build) {
                return build.id;
            }).last(count).value();
            if (count === 1) {
                return last[0];
            } else {
                return last;
            }
        }
    });

    var ProjectList = Backbone.Collection.extend({
        model: Project,
        localStorage: new Store(storePrefix + 'projects'),
        update: function() {
            this.each(function(project) {
                project.loadFromTravis(project);
            });
        }
    });

    var Projects = new ProjectList;

    var ProjectView = Backbone.View.extend({
        tagName: 'tr',
        template: _.template($('#project-row').html()),
        branchProjectTemplate: _.template($('#branch-project-row').html()),
        events: {
            'click .delete': 'clear',
            'click': 'toggleBranches'
        },
        initialize: function() {
            _.bindAll(this, 'render', 'clear', 'remove', 'toggleBranches');
            this.model.bind('change', this.render);
            this.model.bind('destroy', this.remove);

        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON())).addClass(
                'project').addClass(
                    this.model.get('last_build_status') ? 'red' : 'green');
            var sparklineOptions = {
                type: 'tristate',
                posBarColor: 'green',
                negBarColor: 'red'};
            var trendData = this.model.trendData();
            this.$('.sparkline').sparkline(
                this.model.trendData(),
                sparklineOptions);
            var branch_list = this.$('.project .branches').hide();
            var model = this.model;
            var branches = this.model.get('branches');
            if (branches !== null) {
                var projectTemplate = this.branchProjectTemplate;
                var sparklineTemplate = this.branchSparklineTemplate;
                _.chain(branches).keys().each(function(branch) {
                    branchTrend = model.trendData(branch);
                    build = model.lastBuild(branch);
                    el = $('<li/>').html(projectTemplate({
                        'branch': branch,
                        'build': build,
                        'slug': model.get('slug')}));
                    el.addClass(
                        _.last(branchTrend) == 1 ? 'green' : 'red').appendTo(
                            branch_list).children('.sparkline').sparkline(
                            branchTrend,
                            sparklineOptions);
                });
            }
            return this;
        },
        toggleBranches: function(e) {
            if (typeof e !== 'undefined' && e.target.nodeName === 'A') {
                return;
            }
            this.$el.find('.branches').toggle();
            $.sparkline_display_visible();
        },
        clear: function() {
            this.model.destroy();
        }
    });

    var TravisMonitorView = Backbone.View.extend({
        el: $('#container'),
        events: {
            'keypress #new-project': 'addOnEnter'
        },
        model: Project,
        view: ProjectView,
        collection: Projects,
        initialize: function() {
            _.bindAll(this, 'addProject', 'addAll', 'adjustCount',
                      'addOnEnter');
            this.collection.bind('add', this.addProject);
            this.collection.bind('remove', this.adjustCount);
            this.collection.bind('reset', this.addAll);
            this.input = $('#new-project');
            this.collection.fetch();
            this.collection.update();
        },
        addProject: function(project) {
            var view = new this.view({model: project});
            $('#no-projects').hide();
            $('#projects').append(view.render().el);
            $.sparkline_display_visible();
        },
        addAll: function() {
            this.adjustCount(),
            this.collection.each(this.addProject);
        },
        adjustCount: function() {
            if (!this.collection.length) {
                $('#no-projects').show();
            }
        },
        addOnEnter: function(e) {
            if (e.keyCode === 13) {
                var project = new this.model({
                    'slug': this.input.val()
                });
                project.collection = this.collection;
                this.input.val('');
                return project.loadFromTravis().success(function() {
                    project.collection.add([project]);
                });
            }
        }
    });

    var app = new TravisMonitorView;

    $(location.hash).addClass('highlight');
    $(window).on('hashchange', function() {
        $('.highlightable').removeClass('highlight');
        $(location.hash).addClass('highlight');
    });

    window.Project = Project;
    window.ProjectList = ProjectList;
    window.ProjectView = ProjectView;
    window.TravisMonitorView = TravisMonitorView;
});



