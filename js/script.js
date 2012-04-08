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
            'builds': {},
        },
        loadFromTravis: function(args) {
            var obj = this;
            $.getJSON(travisURL(this.get('slug')), args).success(function(data){
                obj.save(data);
            });
            $.getJSON(travisURL(this.get('slug') + '/builds')).success(function(data) {
                builds = obj.get('builds') || {}
                _.each(data, function(build) {
                    builds[build.id] = build;
                });
                obj.save({builds: builds})
            });
        },
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
        },
        addAll: function() {
            Projects.each(this.addProject);
        },
        addOnEnter: function(e) {
            if (e.keyCode === 13) {
                var project = new Project({
                    'slug': this.input.val(),
                });
                this.input.val('');
                project.loadFromTravis({async: false});
                Projects.add([project]);
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



