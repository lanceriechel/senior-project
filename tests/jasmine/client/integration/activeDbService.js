/**
 * Created by iversoda on 11/9/14.
 */
describe("activeDbService", function() {
    describe(".isAdding", function() {
        it("true if Entry added to DB correctly", function() {
            ActiveDBService.addRowToTimeSheet("10/2/14","TestID", "projectID",
                "some comment",
                1,
                2,
                3,
                4,
                5,
                6,
                7);
                result=TimeSheet.find({'userID': "TestID"});
            expect(result[0].EntryArray[5]==6).toBe(true);
        });

    });
    describe(".isUpdating", function(){
        it("true Updating entries Correctly", function(){
            ActiveDBService.updateRowInTimeSheet("10/2/14", "TestID", "projectID",
                "new comment",
                1,
                2,
                3,
                4,
                5,
                7,
                7);
            result=TimeSheet.find({'userID': "TestID"});
            expect(result[0].EntryArray[5]==7).toBe(true);
        });

    });
    describe(".iRemoving", function(){
        it("true if Removing Entries Correctly", function(){
            ActiveDBService.removeRowInTimeSheet("10/2/14", "TestID", "projectID");

            expect(TimeSheet.find({'userId': "TestID"}).isEmpty()).toBe(false);
        });

    });
});