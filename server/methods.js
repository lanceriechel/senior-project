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
        updateRevision: function (id, revision){
            TimeSheet.update({'_id':id},
            {
                $set:{
                    'revision': revision
                }
            });
        },
        getTotalHoursForProject: function(timesheet, projectId){
        /*
            For a given timesheet and projectID, this method sums up the total number of hours worked that week.
        */
        var total = 0;
        timesheet.projectEntriesArray.forEach(function (pe) {
            if (pe.projectId == projectId) {
                pe.EntryArray.forEach(function (a) {
                    for (var b in a.hours) {
                        total += parseInt(a.hours[b]);
                    }
                });
                return total;
            }
        });
        return total;
    },
    updateGenComments: function(date, user, gen_comment, concerns){
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});
        TimeSheet.update({'_id': sheet._id},
            {
                $set:{
                    'generalComment': gen_comment,
                    'concerns': concerns
                }
        });
        return;
    },
    getEmployeesUnderManager: function() {
        /*
            Get all Employees that have worked for the given manager.
            This is so a manager cannot see historical timesheets for other employees.
        */
        var user = Meteor.users.findOne({'_id':Session.get('LdapId')});
        
        if (user.admin) {
            var employees = Meteor.users.find();   
            var employeeIds = [];         
            employees.forEach(function (e) {
                employeeIds.push(e._id);
            });
            return employeeIds
        }

        if (user.manager){

            var projects = ChargeNumbers.find({'manager':user.username});
            var projectIds = [];
            projects.forEach(function (p) {
                projectIds.push(p._id);
            });

            var employees = Meteor.users.find({'projects': { $in: projectIds}});
            var employeeIds = [];
            employees.forEach(function (e) {
                employeeIds.push(e._id);
            });

            return employeeIds;
        }

        return [user._id];
    },
    updateProjectCommentsTimeSheet: function(date, user, project, issues, next, data){
        /*
            Update project comments seciton of an active timesheet for a specified project.
            This should be called from an onBlur event.
        */
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});
        var prEntriesArr = sheet['projectEntriesArray'];
        var entryArrToAdd = null;
        var oldproject;

        //check to make sure editable
        var sentBack;
        var approved;
        var active = sheet['active'];
        var submitted = sheet['submitted'];
        //active = 1 and (SentBack = true or submitted = false)            
        if (active != 1){
            return;
        }
        var pSentBacks = {};
        for (var i in sheet.projectApprovalArray){
            pSentBacks[sheet.projectApprovalArray[i].projectId] = sheet.projectApprovalArray[i].sentBack;
        }
        var index=0;

        for(i=0 ; i<prEntriesArr.length ; i++){
            if(prEntriesArr[i]['projectId'] == project){
                index = i;
                entryArrToAdd = prEntriesArr[i];
                oldproject = prEntriesArr[i]['projectId'];
                sentBack = pSentBacks[project];
            }
        }
        
        if(data){
            //alert("doesnt work C"); 
            if(oldproject != data.project){ 
                return; 
            }
        } else if(submitted && !sentBack){
            return;
        }
        
        entryArrToAdd['next'] = next;
        entryArrToAdd['issues'] = issues;
        prEntriesArr.splice(index,1)
        prEntriesArr.splice(index, 0, entryArrToAdd);
 
        TimeSheet.update({'_id':sheet._id},{
                $set:{
                        'projectEntriesArray': prEntriesArr
                },
        });

    },
    updateApprovalStatusInTimeSheet: function(date, user, projectId, approvalStatus, rejectMessage){
        /*
            Updates each row's approval and sentBack status for the timesheet, so the activeTimesheet UI knows what the user
            is allowed to change and what is locked.
        */
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user,'submitted':true});
        var active = sheet.active;
        if(!approvalStatus){
            active = 1;
        }
        var prEntriesArr = sheet['projectEntriesArray'];
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
            if (prEntriesArr[index].projectId == projectId){
                console.log(prEntriesArr[index]);
                prEntriesArr[index].rejectMessage = rejectMessage;
                // if(!approvalStatus){
                //     prEntriesArr[index].SentBack = true;
                // }
                // else {
                //     prEntriesArr[index].SentBack = false;
                // }

                break;
            }
        }
        TimeSheet.update({'_id':sheet._id},
            {
                $set:{
                    'projectEntriesArray': prEntriesArr,
                    'globalSentBack' : !approvalStatus,
                    'projectApprovalArray' : projectApprovalArray,
                    'active' : active
                }
            });

    },
    updateActiveStatusInTimesheet: function(date, user, projectId){
        /*
            Go through the timesheet and set active to false if it is submitted and completely approved.
            Otherwise, set active to true.
        */
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user,'submitted':true});
        var prApprovalArr = sheet['projectApprovalArray'];
        var active = 0;

        for (var index in prApprovalArr){
            if(!prApprovalArr[index].approved){ //If at least one entry is not approved, timesheet still active
                active = 1;
            }
        }

        TimeSheet.update({'_id':sheet._id},
            {
                $set:{
                    'active': active
                }
            });
        return;

    },

    updateCommentsInTimeSheet: function(date, user, gen_comment, concerns){
        /*
            Update comments and concerns seciton of an active timesheet.
            This should be called from an onBlur event.
        */
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});
        
        //make sure not updating when it shouldn't
        var data = Session.get('editing-user-page');
        var disable = data || (sheet['submitted']  && !TimeSheetService.checkSentBack());
        if(disable){
            return;
        }
        TimeSheet.update({'_id':sheet._id},
            {
                $set:{
                    'generalComment': gen_comment,
                    'concerns': concerns
                }
        });
    },

    submitTimesheet: function(date, user){
        /*
            Set a timesheet's submitted status to true.
        */
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});
        if(sheet){
            var projectApprovalArray = sheet.projectApprovalArray;
            for (var key in projectApprovalArray){
                    projectApprovalArray[key] = {
                        projectId : projectApprovalArray[key].projectId,
                        approved : false,
                        sentBack : false
                    };
            }

            TimeSheet.update({'_id':sheet._id},
                {
                    $set:{
                        'submitted': true,
                        'globalSentBack': false,
                        'projectApprovalArray' : projectApprovalArray
                    }
            });
        }
    },

    addRowToTimeSheet: function(date, user, project, comment,Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, rowID) {
        /* 
            Adds a single Entry to the Timesheet. 
            This entry corresponds to a single Row on the web page.
        */
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

        var prEntriesArr = sheet['projectEntriesArray'];
        var entryArrToAdd = null;
        var entryArray = null;
        var index=0;

        for(i=0 ; i<prEntriesArr.length ; i++){
            if(prEntriesArr[i]['projectId'] == project){
                index = i;
                entryArrToAdd = prEntriesArr[i];
                entryArray = prEntriesArr[i]['EntryArray'];
            }
        }

        if(entryArrToAdd != null){

            entryArray.push({
                'hours': [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday],
                'Comment': comment,
                'rowID' : rowID
                }
            );

            entryArrToAdd['EntryArray'] = entryArray;
            // if(sheet['submitted']){ //Then we are fixing a rejected project row, and are sending it back to the manager
            //     entryArrToAdd['SentBack'] = true;
            // }
            var projectApprovalArray = sheet.projectApprovalArray;
            if(sheet['submitted']){
                for (var key in projectApprovalArray){
                    if (projectApprovalArray[key].projectId == project){
                        projectApprovalArray[key].sentBack = true;
                    };
                }
            }
            
            prEntriesArr.splice(index,1)
            prEntriesArr.push(entryArrToAdd);

        }else{
            entryArray = [{
                'hours': [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday],
                'Comment': comment,
                'rowID' : rowID
                }];

            entryArrToAdd = {
                'projectId' : project,
                'EntryArray' : entryArray
            }
            // if(sheet['submitted']){ //Then we are fixing a rejected project row, and are sending it back to the manager
            //     entryArrToAdd['SentBack'] = true;
            // }
            var projectApprovalArray = sheet.projectApprovalArray;
            if(sheet['submitted']){
                for (var key in projectApprovalArray){
                    if (projectApprovalArray[key].projectId == project){
                        projectApprovalArray[key].sentBack = true;
                    };
                }
            }
            
            prEntriesArr.push(entryArrToAdd);
        }
        TimeSheet.update({'_id':sheet._id},{
                    $set:{
                        'projectEntriesArray': prEntriesArr,
                        'projectApprovalArray': projectApprovalArray,
                    },
                });
    },

    removeRowInTimeSheet: function(date, userId, rowID, project, data){
        var sheet = TimeSheet.findOne({'startDate':date,'userId':userId});
        var prEntriesArr = sheet['projectEntriesArray'];
        var entryArrToAdd = null;
        var entryArray = null;
        var entryArray2 = null;
        var oldproject;
        var index1=0;
        var index2=0;

        //check to make sure editable
        var sentBack;
        var approved;
        var active = sheet['active'];
        var submitted = sheet['submitted'];
        //active = 1 and (SentBack = true or submitted = false)            
        if (active != 1){
            return;
        }

        var pSentBacks = {};
        for (var i in sheet.projectApprovalArray){
            pSentBacks[sheet.projectApprovalArray[i].projectId] = sheet.projectApprovalArray[i].sentBack;
        }
        
        for(i=0 ; i<prEntriesArr.length ; i++){
                
                entryArray = prEntriesArr[i]['EntryArray'];
                for(j=0; j<entryArray.length; j++){
                    if(entryArray[j]['rowID'] == rowID){
                        index2 = j;
                        index1 = i;
                        entryArrToAdd = prEntriesArr[i];
                        entryArray2 = prEntriesArr[i]['EntryArray'];
                        oldproject = prEntriesArr[i]['projectId'];
                        sentBack = pSentBacks[oldproject];//prEntriesArr[i]['SentBack']
                    }
                }

        }

        //return if the row should not be editable
        // var data = Session.get('editing-user-page');
        
        if(data){
            if(oldproject != data.project){ 
                return; 
            }
        } else if(submitted && !sentBack){
            return;
        }
        
        entryArray2.splice(index2, 1);

        entryArrToAdd['EntryArray'] = entryArray2;
        prEntriesArr.splice(index1, 1);
        if(entryArray2.length != 0){
           prEntriesArr.splice(index1, 0, entryArrToAdd);
        }



        TimeSheet.update({'_id':sheet._id},{
            $set:{
                    'projectEntriesArray': prEntriesArr
            },
        });
    },
    getRows: function(date, user){
        //This method is for when we want to get all the rows for a user on a given Timecard. -Dan
        return TimeSheet.find({'startDate': date, 'userId': user});
    },

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
            d2.setDate(d.getDate() + 6);
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
                                        projectArray[project._id] = project.name;
                                        projectHours[project._id] = 0;
                                        projectComments[project._id] = [];
                                        comments[project.name] = [];
                                    });
                                    TimeSheet.find({startDate: dStr}).forEach(function (sheet) {
                                        for (var pIndex in sheet.projectEntriesArray) {
                                            var currentProject = sheet.projectEntriesArray[pIndex].projectId;
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
        updateActiveStatusInTimesheetRevision: function (date, user, revision){
            var sheet = TimeSheet.findOne({'startDate':date,'userId':user,'submitted':true});
            var prApprovalArr = sheet['projectApprovalArray'];
            var active = 0;

            for (var index in prApprovalArr){
                if(!prApprovalArr[index].approved){ //If at least one entry is not approved, timesheet still active
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
                if (prEntriesArr[index].projectId == projectId){
                    prEntriesArr[index].rejectMessage = rejectMessage;

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

        },
        addNewProject: function(project){
            var startDate = new Date(project.start_date)
            var endDate = new Date(project.end_date)
            if(startDate > endDate){
                //startDate is after endDate
                return;
            }
            ChargeNumbers.insert(project);
        },
        updateProject: function(id, project){
            ChargeNumbers.update(
            {
                '_id': id
            },
            project
            );
        },
        addProjectToApprovalArray: function(id, approve) {
            TimeSheet.update({'_id':id}, { $addToSet:{'projectApprovalArray' : approve}});
        },
        removeProjectFromApprovalArray: function(id, approvalArray) {
            TimeSheet.update({'_id':id}, { $set:{'projectApprovalArray' : approvalArray}});
        },
        addEmployeeToProject: function(id, project) {
            Meteor.users.update({'_id': id}, {$addToSet: {'projects': project}});
        },
        removeEmployeeFromProject: function(id, project) {
            Meteor.users.update({'_id': id}, {$pull: {'projects': project}});
        },
        setEmployeeFullTime: function(id, isFullTime) {
            Meteor.users.update({'_id': id}, {$set: {'fulltime': isFullTime}});
        },
        insertNewUser: function(username, common_name, manager, admin, email, projects, fulltime, groups){
            id = Meteor.users.insert({
                username: username,
                cn: common_name,
                manager: manager,
                admin: admin,
                email: email,
                projects: projects,
                fulltime: fulltime,
                groups: groups
            });

            return id;
        },
        updateUserInfo: function(id, manager, admin, email, groups){
            Meteor.users.update({
                _id: id
            }, {
                $set: {
                    manager: manager,
                    admin: admin,
                    email: email,
                    groups:groups
                }
            });
        },
        updateTimesheetProjectEntriesArray: function(id, projectEntriesArray){
            TimeSheet.update({'_id':id},
                {
                    $set:{
                        'projectEntriesArray': projectEntriesArray
                    }
                });
        }
    });

    startup();
});
