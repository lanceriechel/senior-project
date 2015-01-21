if (!String.prototype.format) {
      String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) { 
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
            d1L= new Date(),
            d2 = new Date();
        d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
        d1L.setDate((d1L.getDate() - (d1L.getDay() + 6) % 7) - 8);
        d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);


        var dStr = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear(),
            dStrL = (d1L.getMonth() + 1) + "/" + d1L.getDate() + "/" + d1L.getFullYear(),
            d2Str = (d2.getMonth() + 1) + "/" + d2.getDate() + "/" + d2.getFullYear();

        Meteor.users.find({}).forEach(
            function (user) {
                //Small Change (changed uppercase D to d in userId) here to see if this works
                var previousTimesheet=TimeSheet.findOne({'startDate': dStrL, 'userId': user['_id']});
                var currentTimesheet=TimeSheet.findOne({'startDate': dStr, 'userId': user['_id']});
                if (!currentTimesheet) {
                   if (!previousTimesheet){
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
                                'concerns': '',
                                'submitted': false
                            }
                        );
                    }
                        else{
                       var old = previousTimesheet['projectEntriesArray'];
                       for(var entry in  old){
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
                                'concerns': previousTimesheet['concerns'],
                                'submitted': false
                            }
                        );
                    }
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
                    d1L= new Date(),
                    d2 = new Date();
                d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
                d1L.setDate((d1L.getDate() - (d1L.getDay() + 6) % 7) - 8);
                d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);
                
                var dStr = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear(),
                    dStrL = (d1L.getMonth() + 1) + "/" + d1L.getDate() + "/" + d1L.getFullYear(),
                    d2Str = (d2.getMonth() + 1) + "/" + d2.getDate() + "/" + d2.getFullYear();

                Meteor.users.find({}).forEach(
                    function (user) {
                        var previousTimesheet=TimeSheet.findOne({'startDate': dStrL, 'userId': user['_id']});
                       if (!previousTimesheet){
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
                                'concerns': '',
                                'submitted': false
                            }
                        );
                    }
                        else{
                        console.log(previousTimesheet);
                        TimeSheet.insert(
                            {
                                'startDate': dStr,
                                'endDate': d2Str,
                                'userId': user['_id'],
                                'active': 1,
                                'revision': [],
                                'projectEntriesArray': previousTimesheet['projectEntriesArray'],
                                'type': 1,
                                'generalComment': previousTimesheet['generalComment'],
                                'concerns': previousTimesheet['concerns'],
                                'submitted': false
                            }
                        );
                    }
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
                                    d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) +6);
                                    var dStr2 = (d2.getMonth() + 1) + '/' + d2.getDate() + '/' + d2.getFullYear();
                                    var start= dStr;
                                    var end=dStr2;
                                    var projectArray = {};//new Array();
                                    var projectHours = {};
                                    ChargeNumbers.find().forEach(function (project){
                                        //console.log(project.name);
                                        projectArray[project.id]= project.name;
                                        projectHours[project.id]=0;
                                    });
                                    TimeSheet.find({startDate: dStr}).forEach(function (sheet){
                                        for (var pIndex in sheet.projectEntriesArray) {
                                            var currentProject = sheet.projectEntriesArray[pIndex].projectID;
                                            for (var eIndex in sheet.projectEntriesArray[pIndex].EntryArray) {
                                                var entry= sheet.projectEntriesArray[pIndex].EntryArray[eIndex];
                                                var sum =0;
                                                for (var hours in entry.hours){
                                                    sum+=entry.hours[hours];
                                                }
                                                projectHours[currentProject]+=sum;
                                            }
                                        }

                                    });
                                    var report = {};
                                    for (var key in projectHours){
                                        report[projectArray[key]]= projectHours[key];
                                    }
                                    //console.log(report);
                                    Meteor.call('sendEmail', 'iversoda@rose-hulman.edu', 'Projects', EmailTemplates.getReportEmail(report,'Comments',start, end));
                                }
                                   
                            });
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
