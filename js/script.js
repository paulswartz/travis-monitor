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
        },
        loadFromTravis: function(args) {
            obj = this;
            $.getJSON(travisURL(this.get('slug')), args).success(function(data){
                obj.save(data);
            });
        },
    });
    
    var ProjectList = Backbone.Collection.extend({
        model: Project,
    });
    
    var Projects = new ProjectList;
    
    var ProjectView = Backbone.View.extend({
        tagName: 'tr',
        template: _.template($('#project-row').html()),
        initialize: function() {
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
        },
        render: function() {
            this.$el.html(this.template(this.model.toJSON())).addClass('project').addClass(
                this.model.get('last_build_status') ? 'red': 'green');
            return this;
        },
        update: function() {
            this.each(function() {
                this.loadFromTravis();
            });
        }
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
    
    Backbone.sync = function(method, model) {
        alert(method + ": " + JSON.stringify(model));
    };
    
    var app = new TravisMonitorView;
    
    p = new Project({
        'slug': 'paulswartz/miller'
    });
    
});



