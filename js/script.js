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
                _.each(data, function(build) {
                    builds[build.id] = build;
                });
                this.save({builds: builds,
                          num_builds: _.size(builds)});
            });
            return xhr;
        },
        trendData: function() {
            return _.chain(this.get('builds')).values().sortBy(function(build) {
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
                project.loadFromTravis.call(project);
            });
        }
    });
    
    var Projects = new ProjectList;
    
    var ProjectView = Backbone.View.extend({
        tagName: 'tr',
        template: _.template($('#project-row').html()),
        events: {
            'click .delete': 'clear',
        },
        initialize: function() {
            _.bindAll(this, 'render', 'clear', 'remove');
            this.model.bind('change', this.render);
            this.model.bind('destroy', this.remove);

        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON())).addClass('project').addClass(
                this.model.get('last_build_status') ? 'red': 'green');
            var trendData = this.model.trendData();
            this.$el.find('.sparkline').sparkline(
                this.model.trendData(),
                {type: 'tristate',
                posBarColor: "green",
                negBarColor: "red"});
            return this;
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
                    Projects.add([project]);
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



