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
}