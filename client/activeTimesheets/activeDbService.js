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
                        total += parseInt(a.hours[b]);
                    }
                });
                return total;
            }
        });
        return total;
    },
    getEmployeesUnderManager: function(manager) {
        /*
            Get all Employees that have worked for the given manager.
            This is so a manager cannot see historical timesheets for other employees.
        */
        var projects = ChargeNumbers.find({'manager':manager});
        var projectIds = [];
        projects.forEach(function (p) {
            projectIds.push(p.id);
        });

        var employees = Meteor.users.find({'projects': { $in: projectIds}});
        var employeeNames = [];
        employees.forEach(function (e) {
            employeeNames.push(e.username);
        });

        return employeeNames;
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

        for(i=0 ; i<prEntriesArr.length ; i++){
                
            entryArray = prEntriesArr[i]['EntryArray'];
            for(j=0; j<entryArray.length; j++){
                if(entryArray[j]['rowID'] == rowID){
                    entryArray2 = prEntriesArr[i]['EntryArray'];
                    oldproject = prEntriesArr[i]['projectID'];
                    index2 = j;
                    index1 = i;
                    entryArrToAdd = prEntriesArr[i];
                }
            }
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
        var prEntriesArr = sheet['projectEntriesArray'];
        for (var index in prEntriesArr){
            if (prEntriesArr[index].projectID == projectId){
                console.log(prEntriesArr[index]);
                prEntriesArr[index].Approved = approvalStatus;
                console.log(prEntriesArr[index]);
                prEntriesArr[index].rejectMessage = rejectMessage;
                if(rejectMessage != "Approved"){
                    prEntriesArr[index].SentBack = true;
                }else{
                    prEntriesArr[index].SentBack = false;
                }
                TimeSheet.update({'_id':sheet._id},
                    {
                        $set:{
                            'projectEntriesArray': prEntriesArr
                        }
                    });

                return;
            }
        }
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
        var index=0;

        for(i=0 ; i<prEntriesArr.length ; i++){
            if(prEntriesArr[i]['projectID'] == project){
                index = i;
                entryArrToAdd = prEntriesArr[i];

            }
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

        TimeSheet.update({'_id':sheet._id},
            {
                $set:{
                    'submitted': true
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
        var index1=0;
        var index2=0;

        for(i=0 ; i<prEntriesArr.length ; i++){
                
                entryArray = prEntriesArr[i]['EntryArray'];
                for(j=0; j<entryArray.length; j++){
                    if(entryArray[j]['rowID'] == rowID){
                        index2 = j;
                        index1 = i;
                        entryArrToAdd = prEntriesArr[i];
                        entryArray2 = prEntriesArr[i]['EntryArray'];
                    }
                }

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
    }
};
