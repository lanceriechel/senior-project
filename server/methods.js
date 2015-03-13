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
        insertTimesheet: function(startDate, endDate, userId, active, revision,
                                  projectEntriesArray, type, generalComment, globalSentBack,
                                  projectApprovalArray, concerns, submitted){
            TimeSheet.insert(
                {
                    'startDate': startDate,
                    'endDate': endDate,
                    'userId': userId,
                    'active': active,
                    'revision': revision,
                    'projectEntriesArray': projectEntriesArray,
                    'type': type,
                    'generalComment': generalComment,
                    'globalSentBack': globalSentBack,
                    'projectApprovalArray': projectApprovalArray,
                    'concerns': concerns,
                    'submitted': submitted
                }
            );
        },
        getCurrentWeekObject: function () {
            var d = new Date(),
                //d1L = new Date(),
                d2 = new Date();
            d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
            //d1L.setDate((d1L.getDate() - (d1L.getDay() + 6) % 7) - 8);
            d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);
            return {
                start: d,
                incrementWeek: function () {
                    this.start.setDate(this.start.getDate() + 7);
                    this.end.setDate(this.end.getDate() + 7);
                },
                decrementWeek: function(){
                    this.start.setDate(this.start.getDate() - 7);
                    this.end.setDate(this.end.getDate() - 7);
                },
                end : d2
            };
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
            Jobs.remove({_id: job._id});
        },
        insertJob: function(jobType, detailType, scheduleText) {
            var id = Jobs.insert({
                type: jobType,
                details: {
                        type: detailType,
                        schedule_text: scheduleText
                    }
            });
            Meteor.call('scheduleJob', Jobs.findOne({_id: id}));
        },
        updateActiveStatusInTimesheet: function (date, user, revision){
            var sheet = TimeSheet.findOne({'startDate':date,'userId':user,'submitted':true});
            var prEntriesArr = sheet['projectEntriesArray'];
            var active = 0;

            for (var index in prEntriesArr){
                if(!prEntriesArr[index].Approved){ //If at least one entry is not approved, timesheet still active
                    active = 1;
                }
            }

            TimeSheet.update({'_id':sheet._id},
                {
                    $set:{
                        'active': active,
                        'revision': revision
                    }
                });
        },
        updateApprovalStatusInTimeSheet: function(date, user, projectId, approvalStatus, rejectMessage, revision){
            /*
             Updates each row's approval and sentBack status for the timesheet, so the activeTimesheet UI knows what the user
             is allowed to change and what is locked.
             */
            var sheet = TimeSheet.findOne({'startDate':date,'userId':user,'submitted':true});
            var active = sheet.active;
            if(!approvalStatus){
                active = 1;
            }
            var prEntriesArr = sheet.projectEntriesArray;
            var projectApprovalArray = sheet.projectApprovalArray;
            var found = false;
            for (var key in projectApprovalArray){
                if (projectApprovalArray[key].projectId == projectId){
                    projectApprovalArray[key] = {
                        projectId : projectId,
                        approved : approvalStatus,
                        sentBack : !approvalStatus,
                        comment: rejectMessage
                    };
                    found = true;
                }
            }
            if (!found){
                projectApprovalArray.push({
                    projectId : projectId,
                    approved : approvalStatus,
                    sentBack : !approvalStatus,
                    comment: rejectMessage
                });
            }
            for (var index in prEntriesArr){
                if (prEntriesArr[index].projectID == projectId){
                    console.log(prEntriesArr[index]);
                    prEntriesArr[index].Approved = approvalStatus;
                    console.log(prEntriesArr[index]);
                    prEntriesArr[index].rejectMessage = rejectMessage;
                    if(!approvalStatus){
                        prEntriesArr[index].SentBack = true;
                    }else {
                        prEntriesArr[index].SentBack = false;
                    }

                    break;
                }
            }

            var newRevision = sheet.revision
            if (revision) {
                // set to new revision if present
                newRevision = revision;
            }

            TimeSheet.update({'_id':sheet._id},
                {
                    $set:{
                        'projectEntriesArray': prEntriesArr,
                        'globalSentBack' : !approvalStatus,
                        'projectApprovalArray' : projectApprovalArray,
                        'active' : active,
                        'revision': newRevision
                    }
                });

        }
    });

    startup();
});