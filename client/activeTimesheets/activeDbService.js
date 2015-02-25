ActiveDBService = { 
    getTotalHoursForProject: function(timesheet, projectID){
        /*
            For a given timesheet and projectID, this method sums up the total number of hours worked that week.
        */
        var total = 0;
        timesheet.projectEntriesArray.forEach(function (pe) {
            if (pe.projectID == projectID) {
                pe.EntryArray.forEach(function (a) {
                    for (var b in a.hours) {
                        total += parseFloat(a.hours[b]);
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
                        sun: parseFloat(days[0]) + parseFloat(current.sun),
                        mon: parseFloat(days[1]) + parseFloat(current.mon),
                        tue: parseFloat(days[2]) + parseFloat(current.tue),
                        wed: parseFloat(days[3]) + parseFloat(current.wed),
                        thu: parseFloat(days[4]) + parseFloat(current.thu),
                        fri: parseFloat(days[5]) + parseFloat(current.fri),
                        sat: parseFloat(days[6]) + parseFloat(current.sat)
                    };
                }
            }
        }

        return timesheets;
    }
};
