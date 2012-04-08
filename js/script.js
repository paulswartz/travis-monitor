/* Author: Paul Swartz <http://paulswartz.net/.

*/


$(document).ready(function () {
    function travisURL(middle) {
        return 'http://travis-ci.org/' + middle + '.json?callback=?';
    };
    
    var Project = Backbone.Model.extend({
        defaults: {
            'slug': 'blank project',
            'last_build_status': -1,
            'builds': null,
            'branches': null,
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
            var builds = null;
            if (typeof branch === 'undefined') {
                builds = this.get('builds');
            } else {
                builds = this.get('branches')[branch];
            }
            return _.chain(builds).values().sortBy(function(build) {
                return build.id;
            }).last(10).map(function(build) {
                return build.result ? -1 : 1;
            }).value();
        }
    });
                                        
    var ProjectList = Backbone.Collection.extend({
        model: Project,
        localStorage: new Store("travis-projects"),
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
        branchProjectTemplate: _.template($("#branch-project-row").html()),
        events: {
            'click .delete': 'clear',
            'click': 'toggleBranches',
        },
        initialize: function() {
            _.bindAll(this, 'render', 'clear', 'remove', 'toggleBranches');
            this.model.bind('change', this.render);
            this.model.bind('destroy', this.remove);

        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON())).addClass('project').addClass(
                this.model.get('last_build_status') ? 'red': 'green');
            var sparklineOptions = {
                type: 'tristate',
                posBarColor: "green",
                negBarColor: "red"};
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
                _.chain(branches).keys().each(function (branch) {
                    branchTrend = model.trendData(branch);
                    $("<li/>").html(projectTemplate({'branch': branch})).addClass(
                        _.last(branchTrend) == 1 ? 'green' : 'red').appendTo(branch_list).children('.sparkline').sparkline(
                            branchTrend,
                            sparklineOptions);
                });
            }
            return this;
        },
        toggleBranches: function() {
            this.$el.find('.branches').toggle();
            console.log(this.$el.find('.branches'));
            $.sparkline_display_visible();
        },
        clear: function() {
            this.model.destroy();
        },
    });

    var TravisMonitorView = Backbone.View.extend({
        el: $('#container'),
        events: {
            'keypress #new-project': 'addOnEnter',
        },
        initialize: function () {
            _.bindAll(this, 'addProject', 'addAll', 'addOnEnter');
            Projects.bind('add', this.addProject);
            Projects.bind('reset', this.addAll);
            this.input = $("#new-project");
            Projects.fetch()
            Projects.update();
        },
        addProject: function (project) {
            var view = new ProjectView({model: project});
            $("#no-projects").hide();
            $("#projects").append(view.render().el);
            $.sparkline_display_visible();
        },
        addAll: function() {
            Projects.each(this.addProject);
        },
        addOnEnter: function(e) {
            if (e.keyCode === 13) {
                var project = new Project({
                    'slug': this.input.val(),
                });
                project.collection = Projects;
                this.input.val('');
                project.loadFromTravis().success(function() {
                    Projects.add(project);
                });
            }
        },
    });
    
    var app = new TravisMonitorView;

    $(location.hash).addClass('highlight');
    $(window).on('hashchange', function() {
        $('.highlightable').removeClass('highlight');
        $(location.hash).addClass('highlight');
    });
});



