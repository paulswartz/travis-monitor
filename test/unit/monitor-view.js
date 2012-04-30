$(document).ready(function() {
    module("Monitor View", {
        setup: function() {
            localStorage.setItem("qunit-monitor-view-test", "");
            this.collection = new ProjectList();
            this.collection.localStorage = new Store("qunit-monitor-view-test");
            this.projects = $("<div id='projects' />");
            this.input = $("<input type='text' id='new-project' />");
            var fixture = $("#qunit-fixture");
            fixture.append(this.projects);
            fixture.append(this.input);
            $("<a href='' id='refresh'>Refresh</a>").appendTo(fixture);
            $("<div id='no-projects' />").show().appendTo(fixture);
            this.app = new TravisMonitorView({
                collection: this.collection
            });
        }
    });

    test("defaults", 1, function() {
        equal(this.projects.find('tr').length, 0, 'no rows');
    });

    test("addProject", 2, function() {
        this.collection.create({
            slug: "rails/rails"
        });
        equal(this.projects.find('tr').length, 1, 'added a new row');
        this.collection.create({
            slug: "foo/bar"
        });
        equal(this.projects.find('tr').length, 2, 'added a new row');
    });

    test("addOnEnter", 2, function() {
        this.input.val("rails/rails");
        var that = this;
        this.app.addOnEnter({keyCode: 13}).success(function() {
            start();
            equal(that.projects.find('tr').length, 1, "added new project");
            ok(that.collection.get(891), 'got data from travis');
        });
        stop();
    });

    test("No projects", 3, function () {
        ok($("#no-projects:visible").length, "No projects ID visible");
        var project = this.collection.create({
            slug: "rails/rails"
        });
        equal($("#no-projects:visible").length, 0, "No projects ID hidden");
        project.destroy();
        ok($("#no-projects:visible").length, "No projects ID visible");
    });

    test('refresh', 5, function() {
        var project = this.collection.create({
            slug: 'rails/rails'
        });
        equal(project.get('builds'), null, 'no builds to start');
        this.app.on('refresh:stop', function () {
            this.off('refresh:stop');
            start();
            equal(project.get('num_builds'), 25, 'loaded some builds after click');
            equal(this.refresh_link.text(), 'Refresh', 'button text updated on end');
            equal(this.refresh(), false, 'refresh function stops event handling');
        });
        equal(this.app.refresh_link.click().text(), 'Refreshing...', 'button text updated on start');
        stop();
    });
});
