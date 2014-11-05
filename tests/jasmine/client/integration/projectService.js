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
        it("returns true for the current date", function() {
            var date = new Date();
            var d = date.getDate();
            var m = date.getMonth()+1;
            var year = date.getFullYear();

            if(d<10) {
                d='0'+d
            }

            if(m<10) {
                m='0'+m
            }

            date = m+'/'+d+'/'+year;
            var date1 = new Date(date);
            expect(ProjectService.isActive(date1.toLocaleDateString())).toBe(true);
        });
    });
    describe(".datesValid", function(){
        it("true if endDate after startDate", function(){
            expect(ProjectService.datesValid("10/16/2014", "10/23/2014")).toBe(true);
        });
        it("true if endDate same as startDate", function(){
            expect(ProjectService.datesValid("10/23/2014", "10/23/2014")).toBe(true);
        });
        it("false if endDate before startDate", function(){
            expect(ProjectService.datesValid("10/16/2014", "10/10/2014")).toBe(false);
        });
        it("true if startDate is not given", function(){
            expect(ProjectService.datesValid("", "10/10/2014")).toBe(true);
        });
        it("true if endDate is not given", function(){
            expect(ProjectService.datesValid("10/16/2014", "")).toBe(true);
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