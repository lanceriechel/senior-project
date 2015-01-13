generalHelpers = {
	getSunday: function(){
        var d = new Date();
  		d.setDate((d.getDate() - (d.getDay() + 6) % 7 )- 1);
  		return d.toLocaleDateString();
    },
    getSaturday: function(){
        var d = new Date();
  		d.setDate((d.getDate() - (d.getDay() + 6) % 7 ) + 6);
  		return d.toLocaleDateString();
    },
    MakeTimesheetForNewUser: function(id, user){
        var d = new Date(),
            d2 = new Date();
        d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
        d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7) + 6);
        var dStr = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear(),
            d2Str = (d2.getMonth() + 1) + '/' + d2.getDate() + '/' + d2.getFullYear();
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