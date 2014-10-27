describe("projectService", function() {
    describe(".isActive", function() {
        it("returns true for dates after the current date", function() {
            var date = new Date("October 13, 2020");
            expect(ProjectService.isActive(date.toLocaleDateString())).toBe(true);
        });
        it("returns false for the past date", function() {
            var date = new Date("October 13, 2010");
            expect(ProjectService.isActive(date.toLocaleDateString())).toBe(false);
        });
    });
    describe(".areValidProjectParams", function(){
        it("false if missing charge number", function(){
            expect(ProjectService.areValidProjectParams("", "name", "10/16/2014", "10/23/14", "me")).toBe(false);
        });
        it("false if missing name", function(){
            expect(ProjectService.areValidProjectParams("123", "", "10/16/2014", "10/23/14", "me")).toBe(false);
        });
        it("false if missing start date", function(){
            expect(ProjectService.areValidProjectParams("123", "name", "", "10/23/14", "me")).toBe(false);
        });
        it("false if missing end date", function(){
            expect(ProjectService.areValidProjectParams("123", "name", "10/16/2014", "", "me")).toBe(false);
        });
        it("false if missing manager", function(){
            expect(ProjectService.areValidProjectParams("123", "name", "10/16/2014", "10/23/14", "")).toBe(false);
        });
        it("true if not missing anything", function(){
            expect(ProjectService.areValidProjectParams("123", "name", "10/16/2014", "10/23/14", "me")).toBe(true);
        });
    });
});