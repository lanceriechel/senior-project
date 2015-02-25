if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}
Meteor.startup(function () {

    process.env.MAIL_URL = 'smtp://noreply.scientiallc.timesheet%40gmail.com:N1esZd02FBi06WW@smtp.gmail.com:587/';

    // First, checks if it isn't implemented yet.


    function setupMissingTimesheets() {
        /*
         Adds any missing timesheets for the current week
         */
        var d = new Date(),
            d1L = new Date(),
            d2 = new Date();
        d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
        d1L.setDate((d1L.getDate() - (d1L.getDay() + 6) % 7) - 8);
        d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);

        var holidays = [];
        for (i = 0; i < 7; i++) {
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
                    projectApprovalArray.push({
                        projectId : pId,
                        approved: false,
                        sentBack: false,
                        comment: ''
                    });
                });
                var previousTimesheet = TimeSheet.findOne({'startDate': dStrL, 'userId': user['_id']});
                var currentTimesheet = TimeSheet.findOne({'startDate': dStr, 'userId': user['_id']});
                if (!currentTimesheet) {
                    if (!previousTimesheet) {
                        console.log(previousTimesheet);
                        TimeSheet.insert(
                            {
                                'startDate': dStr,
                                'endDate': d2Str,
                                'userId': user['_id'],
                                'active': 1,
                                'revision': [],
                                'projectEntriesArray': [],
                                'type': 1,
                                'generalComment': '',
                                'globalSentBack': false,
                                'projectApprovalArray': projectApprovalArray,
                                'concerns': '',
                                'submitted': false
                            }
                        );
                    }
                    else {
                        var old = previousTimesheet['projectEntriesArray'];
                        for (var entry in  old) {
                            old[entry].Approved = false;
                            old[entry].rejectMessage = '';
                            old[entry].SentBack = false;
                        }
                        TimeSheet.insert(
                            {
                                'startDate': dStr,
                                'endDate': d2Str,
                                'userId': user['_id'],
                                'active': 1,
                                'revision': [],
                                'projectEntriesArray': old,
                                'type': 1,
                                'generalComment': previousTimesheet['generalComment'],
                                'globalSentBack': false,
                                'projectApprovalArray': projectApprovalArray,
                                'concerns': previousTimesheet['concerns'],
                                'submitted': false
                            }
                        );
                    }

                    addOrRemoveHolidayHours(d, user);
                }
            }
        );
    }

    setupMissingTimesheets();

    function setupWeeklyTimesheetAdder() {
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
                var d = new Date(),
                    d1L = new Date(),
                    d2 = new Date();
                d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
                d1L.setDate((d1L.getDate() - (d1L.getDay() + 6) % 7) - 8);
                d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);

                var dStr = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear(),
                    dStrL = (d1L.getMonth() + 1) + "/" + d1L.getDate() + "/" + d1L.getFullYear(),
                    d2Str = (d2.getMonth() + 1) + "/" + d2.getDate() + "/" + d2.getFullYear();

                Meteor.users.find({}).forEach(
                    function (user) {
                        var projectApprovalArray = [];
                        user.projects.forEach(function (pId) {
                            projectApprovalArray.push({
                                projectId : pId,
                                approved: false,
                                sentBack: false,
                                comment: ''
                            });
                        });
                        var previousTimesheet = TimeSheet.findOne({'startDate': dStrL, 'userId': user['_id']});
                        if (!previousTimesheet) {
                            console.log(previousTimesheet);
                            TimeSheet.insert(
                                {
                                    'startDate': dStr,
                                    'endDate': d2Str,
                                    'userId': user['_id'],
                                    'active': 1,
                                    'revision': [],
                                    'projectEntriesArray': [],
                                    'type': 1,
                                    'generalComment': '',
                                    'globalSentBack': false,
                                    'projectApprovalArray': projectApprovalArray,
                                    'concerns': '',
                                    'submitted': false
                                }
                            );
                        }
                        else {
                            //console.log(previousTimesheet);
                            var old = previousTimesheet['projectEntriesArray'];
                            for (var entry in  old) {
                                old[entry].Approved = false;
                                old[entry].rejectMessage = '';
                                old[entry].SentBack = false;
                            }
                            TimeSheet.insert(
                                {
                                    'startDate': dStr,
                                    'endDate': d2Str,
                                    'userId': user['_id'],
                                    'active': 1,
                                    'revision': [],
                                    'projectEntriesArray': old,
                                    'type': 1,
                                    'generalComment': previousTimesheet['generalComment'],
                                    'globalSentBack': false,
                                    'projectApprovalArray': projectApprovalArray,
                                    'concerns': previousTimesheet['concerns'],
                                    'submitted': false
                                }
                            );
                        }

                        addOrRemoveHolidayHours(d, user);
                    }
                );
            }
        });
    }

    Meteor.methods({
        sendEmail: function (to, subject, body) {
            /*
             Send the Email
             */
            Email.send({
                bcc: to, from: 'noreply.scientiallc.timesheet@gmail.com',
                html: body,
                subject: subject
            });
        },
        scheduleJob: function (job) {
            console.log('on server, Scheduling Job');
            console.log(job.type);
            console.log(job.details.schedule_text);
            switch (job.type) {
                case 'email':
                    switch (job.details.type) {
                        case 'reminder':
                            SyncedCron.add({
                                name: job.type + 'job: ' + job._id,
                                schedule: function (parser) {
                                    // parser is a later.parse object
                                    return parser.text(job.details.schedule_text);
                                },
                                job: function () {
                                    var d = new Date();
                                    d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
                                    var dStr = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();

                                    var toRemind = [];
                                    TimeSheet.find({startDate: dStr, submitted: false}).forEach(function (sheet) {
                                        toRemind.push({_id: sheet.userId});
                                    });

                                    toSendEmail = [];
                                    Meteor.users.find({$or: toRemind}).map(function (u) {
                                        toSendEmail.push(u.email);
                                    });
                                    Meteor.call('sendEmail', toSendEmail, 'Please Submit Your Timesheet', EmailTemplates.getReminderEmail());
                                }
                            });
                            break;
                        case 'report' :

                            SyncedCron.add({
                                name: job.type + 'job: ' + job._id,
                                schedule: function (parser) {
                                    // parser is a later.parse object
                                    return parser.text(job.details.schedule_text);
                                },
                                job: function () {
                                    var d = new Date();
                                    var d2 = new Date();
                                    d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
                                    var dStr = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
                                    d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);
                                    var dStr2 = (d2.getMonth() + 1) + '/' + d2.getDate() + '/' + d2.getFullYear();
                                    var start = dStr;
                                    var end = dStr2;
                                    var projectArray = {};//new Array();
                                    var projectHours = {};
                                    var projectComments = {};
                                    var comments = {};
                                    ChargeNumbers.find().forEach(function (project) {
                                        //console.log(project.name);
                                        projectArray[project.id] = project.name;
                                        projectHours[project.id] = 0;
                                        projectComments[project.id] = [];
                                        comments[project.name] = [];
                                    });
                                    TimeSheet.find({startDate: dStr}).forEach(function (sheet) {
                                        for (var pIndex in sheet.projectEntriesArray) {
                                            var currentProject = sheet.projectEntriesArray[pIndex].projectID;
                                            for (var eIndex in sheet.projectEntriesArray[pIndex].EntryArray) {
                                                var entry = sheet.projectEntriesArray[pIndex].EntryArray[eIndex];
                                                var sum = 0;
                                                for (var hours in entry.hours) {
                                                    sum += parseFloat(entry.hours[hours]);
                                                }
                                                projectHours[currentProject] += sum;
                                                projectComments[currentProject].push(entry.Comment);
                                            }
                                        }

                                    });
                                    var report = {};
                                    //var comments= {};
                                    for (var key in projectHours) {
                                        report[projectArray[key]] = projectHours[key];
                                        comments[projectArray[key]] = projectComments[key];
                                    }
                                    //console.log(report);
                                    Meteor.call('sendEmail', 'iversoda@rose-hulman.edu', 'Projects', EmailTemplates.getReportEmail(report, comments, start, end));
                                }

                            });
                            break;
                    }
                    break;
            }
            SyncedCron.start();
        },
        deleteJob: function (job) {
            SyncedCron.remove(job.type + 'job: ' + job._id);
        }
    });

    setupWeeklyTimesheetAdder();

    function scheduleReminders() {
        Jobs.find({}).forEach(function (job) {
            Meteor.call('scheduleJob', job);
        });
    }

    scheduleReminders();

    //start all jobs
    SyncedCron.start();
});

function addOrRemoveHolidayHours(d, user) {
    var dStr = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear()
    var timesheet = TimeSheet.findOne({'startDate': dStr, 'userId': user['_id']});
    var holidayProject = ChargeNumbers.findOne({'is_holiday': true});

    if (!holidayProject || user['projects'].indexOf(holidayProject.id) == -1) {
        return;
    }

    var rowID = 0;
    if (timesheet.projectEntriesArray.length > 0) {
        var pEntry = timesheet.projectEntriesArray[timesheet.projectEntriesArray.length - 1];
        rowID = pEntry.EntryArray[pEntry.EntryArray.length - 1].rowID + 1;
    }

    timesheet.projectEntriesArray.forEach(function (p) {
        if (p.projectID == holidayProject.id) {
            //ActiveDBService.removeRowInTimeSheet(d, user['_id'], rowID, holidayProject._id);
            var prEntriesArr = timesheet['projectEntriesArray'];
            var entryArrToAdd = null;

            for (i = 0; i < prEntriesArr.length; i++) {
                if (prEntriesArr[i]["projectID"] == holidayProject.id) {
                    prEntriesArr.splice(i, 1);
                    break;
                }
            }

            TimeSheet.update({'_id': timesheet._id}, {
                $set: {
                    'projectEntriesArray': prEntriesArr
                },
            });
        }
    });

    var hours = [];
    for (i = 0; i < 7; i++) {
        var dH = new Date();
        dH.setDate(d.getDate() + i);
        if (check_holiday(dH)) {
            hours.push(8);
        } else {
            hours.push(0);
        }
    }

    if (hours.indexOf(8) > -1) {
        // ActiveDBService.addRowToTimeSheet(dStr, user['_id'], holidayProject.id, "", hours[0], hours[1], hours[2], hours[3], hours[4], hours[5], hours[6], rowID);
        var prEntriesArr = timesheet['projectEntriesArray'];
        var entryArrToAdd = null;
        var entryArray = null;
        entryArray = [{
            'hours': hours,
            'Comment': "Holiday Pay",
            'rowID': rowID
        }];

        entryArrToAdd = {
            'projectID': holidayProject.id,
            'EntryArray': entryArray,
            'Approved': false
        };

        prEntriesArr.push(entryArrToAdd);

        TimeSheet.update({'_id': timesheet._id}, {
            $set: {
                'projectEntriesArray': prEntriesArr
            },
        });
    }
}

/*
 * Holiday checker function from http://www.softcomplex.com/forum/viewthread_2814/
 */
function check_holiday(dt_date) {

    // check simple dates (month/date - no leading zeroes)
    var n_date = dt_date.getDate(),
        n_month = dt_date.getMonth() + 1;
    var s_date1 = n_month + '/' + n_date;

    if (s_date1 == '1/1' // New Year's Day
        || s_date1 == '6/14' // Flag Day
        || s_date1 == '7/4' // Independence Day
        || s_date1 == '11/11' // Veterans Day
        || s_date1 == '12/25' // Christmas Day
    ) return true;

    // weekday from beginning of the month (month/num/day)
    var n_wday = dt_date.getDay(),
        n_wnum = Math.floor((n_date - 1) / 7) + 1;
    var s_date2 = n_month + '/' + n_wnum + '/' + n_wday;

    if (s_date2 == '1/3/1' // Birthday of Martin Luther King, third Monday in January
        || s_date2 == '2/3/1' // Washington's Birthday, third Monday in February
        || s_date2 == '5/3/6' // Armed Forces Day, third Saturday in May
        || s_date2 == '9/1/1' // Labor Day, first Monday in September
        || s_date2 == '10/2/1' // Columbus Day, second Monday in October
        || s_date2 == '11/4/4' // Thanksgiving Day, fourth Thursday in November
    ) return true;

    // weekday number from end of the month (month/num/day)
    var dt_temp = new Date(dt_date);
    dt_temp.setDate(1);
    dt_temp.setMonth(dt_temp.getMonth() + 1);
    dt_temp.setDate(dt_temp.getDate() - 1);
    n_wnum = Math.floor((dt_temp.getDate() - n_date - 1) / 7) + 1;
    var s_date3 = n_month + '/' + n_wnum + '/' + n_wday;

    if (s_date3 == '5/1/1' // Memorial Day, last Monday in May
    ) return true;

    // misc complex dates
    if (s_date1 == '1/20' && (((dt_date.getFullYear() - 1937) % 4) == 0)
    // Inauguration Day, January 20th every four years, starting in 1937.
    ) return true;

    if (n_month == 11 && n_date >= 2 && n_date < 9 && n_wday == 2
    // Election Day, Tuesday on or after November 2.
    ) return true;

    return false;
}
