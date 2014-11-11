ActiveDBService = {
    hasActiveNonSubmitted: function(){
        userId = Meteor.userId();
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
            // Updates and existing "Row" in the database with the new information. This has the same problem as remove since two rows have the same information they will both be changed.
            // We need a rowID field of some kind.-Dan
            //alert("Updating");
            var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

            var entriesArr = sheet['projectEntriesArray'];

            var rowToChange = {
                'projectID': project,
                'EntryArray': [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday],
                'Comment': comment,
                'Approved': false,
                'type': 2,
                'rowID' : rowID
                };
            var index = 0;
            for(i=0 ; i<entriesArr.length ; i++){
                if(entriesArr[i]['rowID'] == rowID){
                    entriesArr.splice(i, 1);
                    index = i;
                    break;
                }
            }
            entriesArr.splice(index, 0, rowToChange);

            TimeSheet.update({'_id':sheet._id},
            {
                $set:{
                    'projectEntriesArray': entriesArr
                }
            });
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

            var entriesArr = sheet['projectEntriesArray'];

            entriesArr.push({
                'projectID': project,
                'EntryArray': [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday],
                'Comment': comment,
                'Approved': false,
                'type': 2,
                'rowID' : rowID
                }
            );

            
            TimeSheet.update({'_id':sheet._id},{
                    $set:{
                        'projectEntriesArray': entriesArr,
                    },
                });
    },

    removeRowInTimeSheet: function(date, user, rowID){

            var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

            var entriesArr = sheet['projectEntriesArray'];

            for(i=0 ; i<entriesArr.length ; i++){
                if(entriesArr[i]['rowID'] == rowID){
                    entriesArr.splice(i, 1);
                }
            }

            TimeSheet.update({'_id':sheet._id},{
                $set:{
                        'projectEntriesArray': entriesArr
                },
            });
    },
    getRows: function(date, user){
        //This method is for when we want to get all the rows for a user on a given Timecard. -Dan
        return TimeSheet.find({'startDate': date, 'userId': user});
    }
};