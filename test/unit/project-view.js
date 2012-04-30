$(document).ready(function() {
    module("Project View", {
        setup: function() {
            localStorage.setItem("qunit-project-view-test", "");
            this.collection = new ProjectList();
            this.collection.localStorage = new Store("qunit-project-view-test");
            this.project = this.collection.create({
                'slug': 'rails/rails',
                'id': -1,
                'last_build_status': 0,
                builds: {
                    1: {id: 1, result: 1},
                    2: {id: 2, result: 1},
                    3: {id: 3, result: 0},
                    4: {id: 4, result: 0}},
                branches: {
                    'foo': {4: {id: 4, result: 0}},
                    'bar': {2: {id: 2, result: 1}}}
            });
            this.view = new ProjectView({model: this.project});
        }
    });

    test("render", 9, function() {
        deepEqual(this.view.render(), this.view, "view returns itself");
        var $el = this.view.$el;
        ok($el.hasClass('project'), "project class");
        ok($el.hasClass('green'), "green class");
        equal($el.find('strong').text(), this.project.get('slug'), "slug displayed");
        equal($el.find(".branches").length, 2, "2 branches");
        ok($el.find('.branches li:eq(0)').hasClass('green'), "first branch green");
        ok($el.find('.branches li:eq(1)').hasClass('red'), "second branch red");
        $el.appendTo($("#qunit-fixture"));
        $.sparkline_display_visible();
        ok($el.find('canvas').length, "sparkline displayed");
        equal(this.view.$el.find(".branches li:visible").length, 0,
              "branches are hidden");
    });
    test("toggleBranches", function() {
        this.view.render();
        this.view.$el.appendTo($("#qunit-fixture"));
        this.view.toggleBranches();
        ok(this.view.$el.find(".branches li:visible").length, "branches are visible");
        equal(this.view.$el.find("canvas").length, 3, "3 sparklines");
        this.view.toggleBranches();
        equal(this.view.$el.find(".branches li:visible").length, 0,
              "branches are hidden");
    });

    test("clear", 1, function() {
        this.view.clear();
        equal(this.collection.length, 0, "clear removed item");
    });

    test("delete event", 2, function() {
        this.view.render();
        equal(this.view.$el.find('.delete').length, 1, "have a delete button");
        this.view.$el.find('.delete').click();
        equal(this.collection.length, 0, "click removed object");
    });

    test("toggle event", 4, function() {
        this.view.render().$el.appendTo($("#qunit-fixture"));
        this.view.$el.click();
        equal(this.view.$el.find(".branches li:visible").length, 2, "branches are visible");
        equal(this.view.$el.find("canvas").length, 3, "3 sparklines");
        this.view.$el.click();
        equal(this.view.$el.find(".branches li:visible").length, 0,
              "branches are hidden");
        this.view.$el.find('a').click();
        equal(this.view.$el.find(".branches li:visible").length, 0,
          "branches are hidden after a link is clicked");
    });
});
