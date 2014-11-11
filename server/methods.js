Meteor.startup(function () {
    //add missing timesheets
    function setupMissingTimesheets () {
        var d = new Date(),
            d2 = new Date();
        d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
        d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);

        var dStr = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear(),
            d2Str = (d2.getMonth() + 1) + "/" + d2.getDate() + "/" + d2.getFullYear();

        Meteor.users.find({}).forEach(
            function (user) {
                if (TimeSheet.find({'startDate': dStr, 'userID': user['_id']}).count() == 0) {
                    TimeSheet.insert(
                        {
                            'startDate': dStr,
                            'endDate': d2Str,
                            'userID': user['_id'],
                            'active': 1,
                            'revision': [],
                            'projectEntriesArray': [],
                            'type': 1,
                            'generalComment': '',
                            'submitted': false
                        }
                    );
                }
            }
        );
    }

    setupMissingTimesheets();

    //Create weekly timesheet adder job
    SyncedCron.add({
        name: 'setup weekly timesheets',
        schedule: function(parser) {
            // parser is a later.parse object
            return parser.text('at 00:00 on Sunday');
        },
        job: function() {
            var d = new Date(),
                d2 = new Date();
            d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
            d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);
            var dStr = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear(),
                d2Str = (d2.getMonth() + 1) + "/" + d2.getDate() + "/" + d2.getFullYear();

            Meteor.users.find({}).forEach(
                function (user) {
                    TimeSheet.insert(
                        {
                            'startDate': dStr,
                            'endDate': d2Str,
                            'userID': user['_id'],
                            'active': 1,
                            'revision': [],
                            'projectEntriesArray': [],
                            'type' : 1,
                            'generalComment': '',
                            'submitted': false
                        }
                    );
                }
            );
        }
    });

    //start the job
    SyncedCron.start();

    Meteor.methods({
    });
});