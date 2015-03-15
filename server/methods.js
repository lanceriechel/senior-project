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
        getTotalHoursForProject: function(timesheet, projectID){
        /*
            For a given timesheet and projectID, this method sums up the total number of hours worked that week.
        */
        var total = 0;
        timesheet.projectEntriesArray.forEach(function (pe) {
            if (pe.projectID == projectID) {
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
                projectIds.push(p.id);
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
    updateRowInTimeSheet: function(date, user, project, comment,Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, rowID){
        /*
            Updates a row in an active timesheet.  This should be called from an onBlur event.
            Note that this is implemented by calling removeRowInTimesheet() followed by addRowToTimesheet().
        */ 

        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});
        var prEntriesArr = sheet['projectEntriesArray'];
        var entryArrToAdd = null;
        var entryArray = null
        var index1=0;
        var index2=0;
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
        
        for(i=0 ; i<prEntriesArr.length ; i++){
                
            entryArray = prEntriesArr[i]['EntryArray'];
            for(j=0; j<entryArray.length; j++){
                if(entryArray[j]['rowID'] == rowID){
                    entryArray2 = prEntriesArr[i]['EntryArray'];
                    oldproject = prEntriesArr[i]['projectID'];
                    index2 = j;
                    index1 = i;
                    entryArrToAdd = prEntriesArr[i];
                    sentBack = prEntriesArr[i]['SentBack']
                }
            }
        }
        
        //return if the row should not be editable
        var data = Session.get('editing-user-page');
        
        if(data){
            if((!submitted || sentBack) || oldproject != data.project){ 
                return; 
            }
        } else if(submitted && !sentBack){
            return;
        }
        
        if(oldproject == project){
            entryArray2.splice(index2, 1);
            entryArray2.splice(index2, 0, {
                'hours': [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday],
                'Comment': comment,
                'rowID' : rowID
            });

            entryArrToAdd['EntryArray'] = entryArray2;
            prEntriesArr.splice(index1, 1);
            prEntriesArr.splice(index1, 0, entryArrToAdd);

            TimeSheet.update({'_id':sheet._id},
            {
                $set:{
                    'projectEntriesArray': prEntriesArr
                }
            });

        }else{
            //Project has been changed
             ActiveDBService.removeRowInTimeSheet(date,user, rowID, project);
             ActiveDBService.addRowToTimeSheet(date, user, project, comment,Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, rowID);
        }
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
                    'active': active
                }
            });
        return;

    },
    updateSentBackStatus: function(date, user){
        /*
            Only updates the sentBack status for the timesheet, so the activeTimesheet UI knows what the user
            is allowed to change and what is locked.
        */
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});
        var prEntriesArr = sheet['projectEntriesArray'];
        var active = 0;

        for (var index in prEntriesArr){
            if(prEntriesArr[index].SentBack){ 
                prEntriesArr[index].SentBack = false;
            }
        }

        TimeSheet.update({'_id':sheet._id},
            {
                $set:{
                    'projectEntriesArray': prEntriesArr
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

    updateProjectCommentsTimeSheet: function(date, user, project, issues, next){
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
        
        var index=0;

        for(i=0 ; i<prEntriesArr.length ; i++){
            if(prEntriesArr[i]['projectID'] == project){
                index = i;
                entryArrToAdd = prEntriesArr[i];
                sentBack = prEntriesArr[i]['SentBack']
                oldproject = prEntriesArr[i]['projectID'];
            }
        }
 
        //return if the row should not be editable
        var data = Session.get('editing-user-page');
        
        if(data){
            //alert("doesnt work C"); 
            if((!submitted || sentBack) || oldproject != data.project){ 
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

    submitTimesheet: function(date, user){
        /*
            Set a timesheet's submitted status to true.
        */
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

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
    },

    addRowToTimeSheet: function(date, user, project, comment,Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, rowID) {
        /* 
            Adds a single Entry to the Timesheet collection. 
            This entry corresponds to a single Row on the web page.
        */
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

        var prEntriesArr = sheet['projectEntriesArray'];
        var entryArrToAdd = null;
        var entryArray = null;
        var index=0;

        for(i=0 ; i<prEntriesArr.length ; i++){
            if(prEntriesArr[i]['projectID'] == project){
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
            if(sheet['submitted']){ //Then we are fixing a rejected project row, and are sending it back to the manager
                entryArrToAdd['SentBack'] = true;
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
                'projectID' : project,
                'EntryArray' : entryArray,
                'Approved' : false,
            }
            if(sheet['submitted']){ //Then we are fixing a rejected project row, and are sending it back to the manager
                entryArrToAdd['SentBack'] = true;
            }
            prEntriesArr.push(entryArrToAdd);
        }
        TimeSheet.update({'_id':sheet._id},{
                    $set:{
                        'projectEntriesArray': prEntriesArr,
                    },
                });
    },

    removeRowInTimeSheet: function(date, user, rowID, project){        
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});
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
        
        for(i=0 ; i<prEntriesArr.length ; i++){
                
                entryArray = prEntriesArr[i]['EntryArray'];
                for(j=0; j<entryArray.length; j++){
                    if(entryArray[j]['rowID'] == rowID){
                        index2 = j;
                        index1 = i;
                        entryArrToAdd = prEntriesArr[i];
                        entryArray2 = prEntriesArr[i]['EntryArray'];
                        oldproject = prEntriesArr[i]['projectID'];
                        sentBack = prEntriesArr[i]['SentBack']
                    }
                }

        }

        //return if the row should not be editable
        var data = Session.get('editing-user-page');
        
        if(data){
            if((!submitted || sentBack) || oldproject != data.project){ 
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

    getTimesheetRowInfo: function(sheet, timesheets) {
        var date = Session.get('historyDate');
        var timesheetsMap = {};
        var timesheetYear = sheet.startDate.split('/')[2];
        var timesheetMonth = sheet.startDate.split('/')[0];
        var employee = Meteor.users.findOne({'_id': sheet.userId}).username;

        if (timesheetYear == date.getFullYear().toString() && timesheetMonth == (date.getMonth() + 1).toString()) {
            if (!(sheet.startDate in timesheetsMap)) {
                timesheetsMap[sheet.startDate] = timesheets.length;
                timesheets[timesheetsMap[sheet.startDate]] = {
                    employee: employee, startDate: sheet.startDate, sun: 0, mon: 0, tue: 0,
                    wed: 0, thu: 0, fri: 0, sat: 0
                };
            }
            for (var pIndex in sheet.projectEntriesArray) {
                for (var eIndex in sheet.projectEntriesArray[pIndex].EntryArray){
                    var entry = sheet.projectEntriesArray[pIndex].EntryArray[eIndex],
                    days = entry.hours,
                    current = timesheets[timesheetsMap[sheet.startDate]];
                    timesheets[timesheetsMap[sheet.startDate]] = {
                        employee: employee,
                        startDate: sheet.startDate,
                        sun: parseInt(days[0]) + parseInt(current.sun),
                        mon: parseInt(days[1]) + parseInt(current.mon),
                        tue: parseInt(days[2]) + parseInt(current.tue),
                        wed: parseInt(days[3]) + parseInt(current.wed),
                        thu: parseInt(days[4]) + parseInt(current.thu),
                        fri: parseInt(days[5]) + parseInt(current.fri),
                        sat: parseInt(days[6]) + parseInt(current.sat)
                    };
                }
            }
        }

        return timesheets;
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
                                                    sum += parseInt(entry.hours[hours]);
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
