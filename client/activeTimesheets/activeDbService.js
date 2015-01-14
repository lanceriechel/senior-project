ActiveDBService = {
    hasActiveNonSubmitted: function(){
        //userId = Meteor.userId();
	userId = Session.get('LdapId');
        var d = new Date();
        d.setDate((d.getDate() - (d.getDay() + 6) % 7 ) - 1);
        d = d.toLocaleDateString();

        var timeentries = TimeSheet.findOne(
            {
                'startDate': d,
                'userId': userId
            }
        );
        // else if( timeentries.count()==0 && (userId != null)){
        if(timeentries == null && TimeSheet != null){
            return true;
        }
        return false;

    },
    getActiveTimesheets: function(){
        return TimeSheet.find({});
    },

    getTotalHoursForProject: function(timesheet, projectID){
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
                 // if(prEntriesArr[i]['projectID'] == project){
                     // index1 = i;
                    
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

                // }
            }
            //return if the row should not be editable
            if(submitted && !sentBack){
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
                // location.reload();
            }
    },
    // Sets the designated Timesheet's project to be approved (either true or false)
    updateApprovalStatusInTimeSheet: function(date, user, projectId, approvalStatus, rejectMessage){
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user,'submitted':true});

        console.log(sheet);

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
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});
        //make sure not submitting when it shouldn't
        var submitted = sheet['submitted'];
        if(submitted){
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

        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

        var prEntriesArr = sheet['projectEntriesArray'];
        var entryArrToAdd = null;

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
            }
        }

        //return if the row should not be editable
        if(submitted && !sentBack){
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
        var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

        TimeSheet.update({'_id':sheet._id},
            {
                $set:{
                    'submitted': true
                }
        });
    },

    addRowToTimeSheet: function(date, user, project, comment,Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, rowID) {
            // Adds a single Entry to the Timesheet collection. This entry corresponds to a single Row on the web page.Essentially 1 Entry for every project.- Dan
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

            // var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

            // var entriesArr = sheet['projectEntriesArray'];

            // for(i=0 ; i<entriesArr.length ; i++){
            //     if(entriesArr[i]['rowID'] == rowID){
            //         entriesArr.splice(i, 1);
            //     }
            // }
        
            var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

            var prEntriesArr = sheet['projectEntriesArray'];
            var entryArrToAdd = null;
            var entryArray = null;
            var entryArray2 = null;

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
                            sentBack = prEntriesArr[i]['SentBack']
                        }
                    }

            }

            //return if the row should not be editable
            if(submitted && !sentBack){
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
    MakeTimesheetForNewUser: function(id, user){
        var d = new Date(),
            d2 = new Date();
        d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
        d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);
        var dStr = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear(),
            d2Str = (d2.getMonth() + 1) + "/" + d2.getDate() + "/" + d2.getFullYear();
        TimeSheet.insert(
        {
            'startDate': dStr,
            'endDate': d2Str,
            'userId': id,
            'active': 1,
            'revision': [],
            'projectEntriesArray': [],
            'type' : 1,
            'generalComment': 'New User got called',
            'concerns': '',
            'submitted': false
        });
    }
};
