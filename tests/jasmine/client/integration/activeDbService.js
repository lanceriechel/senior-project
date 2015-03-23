/**
 * Created by iversoda on 11/9/14.
 */
describe("activeDbService", function () {

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    var username = guid();
    var projectId = guid();
    var projectName = guid();
    var startDate = '10/2/14';

    Meteor.users.remove();
    ChargeNumbers.remove();
    TimeSheet.remove();

    beforeEach(function () {
        this.user = Meteor.users.findOne({username: username});
        this.project = ChargeNumbers.findOne({id: projectId});
        //expect(this.user).not.toBeUndefined();
        ///expect(this.project).not.toBeUndefined();
    });

    it("set up user", function () {
        Meteor.users.insert({
            username: username,
            cn: "Test Id",
            manager: 0,
            admin: 0,
            email: "TestId@domain.com",
            projects: [],
            fulltime: true
        });
        this.user = Meteor.users.findOne({username: username});
        expect(this.user.username).toBe(username);
    });

    it("set up project", function () {
        Meteor.call('addNewProject', {
            'id': projectId,
            'name': projectName,
            'customer': "TestClient",
            'start_date': '1/1/2000',
            'end_date': '1/1/3000',
            'manager': "someusername",
            'indirect': false
        }, function (err, val) {
            var nProject = ChargeNumbers.findOne({id: projectId, 'name': projectName});
            expect(nProject.name).toBe(projectName);
        });

        //spyOn(Meteor, "methods.addNewProject");
        //
        //var nProject = ChargeNumbers.findOne({id: projectId, 'name': projectName});
        //expect(nProject.name).toBe(projectName);
    });

    it("add user to project", function () {
        Meteor.users.update({_id: this.user._id}, {$addToSet: {projects: projectId}});
        var user = Meteor.users.findOne({username: username});
        expect(user.projects).toContain(projectId);
    });

    it("create timesheet", function () {
        var approveArray = [];
        approveArray.push({
            projectId: projectId,
            approved: false,
            sentBack: false
        });
        Meteor.call('insertTimesheet', startDate, '', this.user._id, 1, [], [], 1,
            '', false, approveArray, '', false,
            function (err, val) {
                var ts = TimeSheet.findOne({startDate: startDate, userId: this.user._id});
                expect(ts).not.toBeUndefined();
            });
    });

    it("add Timesheet Row", function () {
        Meteor.call('addRowToTimeSheet', startDate, this.user._id, projectId,
            'some comment',
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            function (err, val) {
                var result = TimeSheet.findOne({userId: this.user._id, startDate: startDate});
                var projectEntry;
                for (var pe in result.projectEntriesArray) {
                    if (result.projectEntriesArray[pe].projectID == projectId) {
                        projectEntry = result.projectEntriesArray[pe];
                        break;
                    }
                }
                expect(projectEntry.EntryArray[0].hours[5]).toBe(6);
            });
    });

    it("update Timesheet Row", function () {
        ActiveDBService.updateRowInTimeSheet(startDate, this.user._id, projectId,
            "new comment",
            1,
            2,
            3,
            4,
            5,
            7,
            7,
            0, //RowID
            function (err, val) {
                var result = TimeSheet.findOne({userId: this.user._id, startDate: startDate});
                var projectEntry;
                for (var pe in result.projectEntriesArray) {
                    if (result.projectEntriesArray[pe].projectID == projectId) {
                        projectEntry = result.projectEntriesArray[pe];
                        break;
                    }
                }
                expect(projectEntry.EntryArray[0].hours[5]).toBe(7);
            });
    });

    it("Remove Timesheet row", function () {
        Meteor.call('removeRowInTimeSheet', startDate, this.user._id, 0, projectId,
            function (err, val) {
                var result = TimeSheet.findOne({userId: this.user._id, startDate: startDate});
                expect(result.projectEntriesArray.isEmpty()).toBe(true);
            });
    });
});