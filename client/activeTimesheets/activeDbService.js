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

    updateRowInTimeSheet: function(date, user, project, comment,Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday){
            // Updates and existing "Row" in the database with the new information. This has the same problem as remove since two rows have the same information they will both be changed.
            // We need a rowID field of some kind.-Dan
            //alert("Updating");
            TimeSheet.update({
                'startDate': date,
                'userID': user,
                'projectID': project
            },{
                $set:{
                    'startDate': date,
                    'userID': user,
                    'Comment': comment,
                    'projectID': project,
                    'EntryArray': [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
                }
            });
    },

    addRowToTimeSheet: function(date, user, project, comment,Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday) {
            // Adds a single Entry to the Timesheet collection. This entry corresponds to a single Row on the web page.Essentially 1 Entry for every project.- Dan
            //alert(project);
            TimeSheet.insert(
                {
                    'startDate': date,
                    'userID': user,
                    'Comment': comment,
                    'projectID': project,
                    'EntryArray': [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday],
                    'Approved': "false"
                }

            );
    },

    removeRowInTimeSheet: function(date, user, project){
            /* Removes All Entries with this startDate userID and projectID. This is obviously bad as we only want to delete one row but two rows with the same user
                startdate and projectID are essentially identical, and I don't know how to distinguish between them. We need the _id for the entry or some other thing that can distinguish
                between the two records. This is something we should talk about -Dan
            */
            //alert("Deleting from DB");
            TimeSheet.remove(
                {
                    'startDate': date,
                    'userID': user,
                    'projectID': project
                }
            );
    },
    getRows: function(date, user){
        //This method is for when we want to get all the rows for a user on a given Timecard. -Dan
        return TimeSheet.find({'startDate': date, 'userID': user});
    }
};