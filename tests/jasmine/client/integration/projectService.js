describe("projectService", function() {
    beforeEach(function() {
        MeteorStubs.install();
    });

    afterEach(function() {
        MeteorStubs.uninstall();
    });

    describe(".isActive", function() {
        it("returns true for dates after the current date", function() {
            var date = new Date("October 13, 2020");
            expect(ProjectService.isActive(date.toLocaleDateString())).toBe(true);
        });
        it("returns false for the past date", function() {
            var date = new Date("October 13, 2010");
            expect(ProjectService.isActive(date.toLocaleDateString())).toBe(false);
        });
    })

});