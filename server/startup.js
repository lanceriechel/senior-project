startup = function (){
    process.env.MAIL_URL = 'smtp://noreply.scientiallc.timesheet%40gmail.com:N1esZd02FBi06WW@smtp.gmail.com:587/';

    // First, checks if it isn't implemented yet.
    function setupMissingTimesheets() {
        /*
         Adds any missing timesheets for the current week
         */
        var dateObject = Meteor.call('getCurrentWeekObject'),
            d = new Date(dateObject.start),
            d2 = new Date(dateObject.end);
        dateObject.decrementWeek();
        var d1L = new Date(dateObject.start);

        //var d = new Date(),
        //    d1L = new Date(),
        //    d2 = new Date();
        //d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
        //d1L.setDate((d1L.getDate() - (d1L.getDay() + 6) % 7) - 8);
        //d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);

        var holidays = [];
        for (var i = 0; i < 7; i++) {
            var dH = new Date();
            dH.setDate(d.getDate() + i);
            if (check_holiday(dH)) {
                holidays.unshift(8);
            } else {
                holidays.unshift(0);
            }
        }

        var dStr = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear(),
            dStrL = (d1L.getMonth() + 1) + "/" + d1L.getDate() + "/" + d1L.getFullYear(),
            d2Str = (d2.getMonth() + 1) + "/" + d2.getDate() + "/" + d2.getFullYear();

        Meteor.users.find({}).forEach(
            function (user) {
                //Small Change (changed uppercase D to d in userId) here to see if this works
                var projectApprovalArray = [];
                user.projects.forEach(function (pId) {
                    var projectId = ChargeNumbers.findOne({_id: pId}).projectId;
                    projectApprovalArray.push({
                        projectId : projectId,
                        approved: false,
                        sentBack: false,
                        comment: ''
                    });
                });
                var previousTimesheet = TimeSheet.findOne({'startDate': dStrL, 'userId': user['_id']});
                var currentTimesheet = TimeSheet.findOne({'startDate': dStr, 'userId': user['_id']});
                if (!currentTimesheet) {
                    if (!previousTimesheet) {
                        Meteor.call('insertTimesheet', dStr, d2Str, user['_id'], 1, [], [], 1,
                            '', false, projectApprovalArray, '', false, function(){addOrRemoveHolidayHours(d, user);});
                    }
                    else {
                        var old = previousTimesheet['projectEntriesArray'];
                        for (var entry in  old) {
                            old[entry].Approved = false;
                            old[entry].rejectMessage = '';
                            old[entry].SentBack = false;
                        }
                        Meteor.call('insertTimesheet', dStr, d2Str, user['_id'], 1, [], old, 1,
                            previousTimesheet.generalComment, false, projectApprovalArray, previousTimesheet.concerns, false, function(){addOrRemoveHolidayHours(d, user);});
                    }
                }
            }
        );
    }

    console.log("start missing setup");
    setupMissingTimesheets();
    console.log("finish missing setup");

    /*
     Create weekly timesheet adder job
     */
    SyncedCron.add({
        name: 'setup weekly timesheets',
        schedule: function (parser) {
            // parser is a later.parse object
            return parser.text('at 00:00 on Saturday');
        },
        job: function () {
            setupMissingTimesheets();
        }
    });

    function scheduleReminders() {
        Jobs.find({}).forEach(function (job) {
            Meteor.call('scheduleJob', job);
        });
    }

    scheduleReminders();

    //start all jobs
    SyncedCron.start();
}