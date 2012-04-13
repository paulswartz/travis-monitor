module("Project List", {
    setup: function() {
        localStorage.setItem("qunit-project-list-test", "");
        this.collection = new ProjectList();
        this.collection.localStorage = new Store("qunit-project-list-test");
    }
});

test("save and load", 5, function() {
    equal(this.collection.length, 0, "start with no projects");
    this.collection.create({slug: "rails/rails", id:891});
    equal(this.collection.length, 1, "added a project");
    ok(this.collection.get(891), "got a project");
    this.collection.reset();
    equal(this.collection.length, 0, "emptied");
    this.collection.fetch();
    equal(this.collection.length, 1, "restored from localStorage");
});

test("update", 1, function() {
    var project = this.collection.create({slug: "rails/rails"});
    project.on('change:id', function() {
        start();
            equal(project.get('id'), 891, 'updated from Travis');
    });
    stop();
    this.collection.update();
});

