module("Project Model", {
    setup: function() {
        localStorage.setItem("qunit-project-model-test", "");
        this.collection = new ProjectList;
        this.collection.localStorage = new Store("qunit-project-mode-test");
    }
});

test("defaults", 4, function() {
    var project = new Project();
    equal(project.get('slug'), 'blank project', "slug default");
    equal(project.get('last_build_status', "build status default"), -1);
    equal(project.get('builds'), null, "builds default");
    equal(project.get('branches'), null, "branches default");
});

test("_travisJSON", 2, function() {
    var project = new Project({
        slug: 'rails/rails',
    });
    stop(2);
    project._travisJSON('', function(data) {
        start();
        equal(data['id'], 891, "loaded repository JSON");
    });
    project._travisJSON('/builds', function(data) {
        start();
        equal(data[0]['repository_id'], 891, "loaded build JSON");
    });
});

test("loadFromTravis", 3, function() {
    var project = new Project({slug: 'rails/rails'});
    project.collection = this.collection;
    stop(2)
    project.loadFromTravis().success(function() {
        start();
        equal(project.get('id'), 891, "loaded project id");
    });
    project.on('change:num_builds', function() {
        if (!project.get('num_builds')) {
            return;
        }
        start();
        var first_build = _.chain(project.get('builds')).values().first().value();
        equal(first_build['repository_id'], 891, "loaded a build");
        equal(project.get('branches')[first_build.branch][first_build.id]['id'], first_build.id,
              "loaded build into branches");
    });
});

test("trendData", 3, function() {
    var project = new Project({
        builds: {
            1: {id: 1, result: 1}, // fail
            2: {id: 2, result: 1}, // fail
            3: {id: 3, result: 0}, // success
            4: {id: 4, result: 0}}, // success
        branches: {
            'foo': {4: {id: 4, result: 0}},
            'bar': {2: {id: 2, result: 1}}}
    });
    deepEqual(project.trendData(), [-1, -1, 1, 1], "overall trend");
    deepEqual(project.trendData('foo'), [1], "foo branch trend");
    deepEqual(project.trendData('bar'), [-1], "bar branch trend");
});

test('lastBuild', 3, function() {
    var project = new Project({
        builds: {
            1: {id: 1, result: 1}, // fail
            2: {id: 2, result: 1}, // fail
            3: {id: 3, result: 0}, // success
            4: {id: 4, result: 0}}, // success
        branches: {
            'foo': {4: {id: 4, result: 0},
                    3: {id: 3, result: 0}},
            'bar': {2: {id: 2, result: 1},
                    1: {id: 1, result: 1}}}
    });
    deepEqual(project.lastBuild(), {id: 4, result: 0}, 'overall last');
    deepEqual(project.lastBuild('foo'), {id: 4, result: 0}, 'foo branch last');
    deepEqual(project.lastBuild('bar'), {id: 2, result: 1}, 'bar branch last');
});

