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

    updateRowInTimeSheet: function(date, user, project, comment,Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, rowID){
            var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

            var prEntriesArr = sheet['projectEntriesArray'];
            var entryArrToAdd = null;
            var entryArray = null

            var index1=0;
            var index2=0;

            var oldproject;

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
                        }
                    }

                // }
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
                // ActiveDBService.removeRowInTimeSheet(date,user, rowID, project);
                // ActiveDBService.addRowToTimeSheet(date, user, project, comment,Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, rowID);
                // location.reload();
            }
    },

    updateCommentsInTimeSheet: function(date, user, gen_comment, concerns){
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
            //alert(project);
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
            var entryArray = null

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
            'generalComment': '',
            'concerns': '',
            'submitted': false
        });
    }
};
