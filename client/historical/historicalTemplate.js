Template.historyInfo.rendered = function(){
    $.each($('[id=start_date]'), function(index, value){
        $(value).datepicker({});
    });
    $.each($('[id=end_date]'), function(index, value){
        $(value).datepicker({});
    });
};

Template.activeTimesheets.helpers({
    getSunday: function(){
        
		var d = new Date();

		d.setDate((d.getDate() - (d.getDay() + 6) % 7 )- 1);
		return d.toLocaleDateString();
    },
    timesheet: function(){
    	return ActiveDBService.getActiveTimesheets(); 
    },
	getTimesheets: function () {
    var userId = Session.get('LdapId');
		var timesheetsMap = {};
		var timesheets = [];

		TimeSheet.find({'userId': userId, 'active': 1}).forEach(
			function (u) {
				if (!(u.startDate in timesheetsMap)) {
					timesheetsMap[u.startDate] = timesheets.length;
					timesheets[timesheetsMap[u.startDate]] = {
						startDate: u.startDate, sun: 0, mon: 0, tue: 0,
						wed: 0, thu: 0, fri: 0, sat: 0
					};
				}
				for (var pIndex in u.projectEntriesArray) {
					for (var eIndex in u.projectEntriesArray[pIndex].EntryArray){
						var entry = u.projectEntriesArray[pIndex].EntryArray[eIndex],
							days = entry.hours,
							current = timesheets[timesheetsMap[u.startDate]];
						timesheets[timesheetsMap[u.startDate]] = {
							startDate: u.startDate,
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
			});
		return timesheets;
	},
    ActiveTimesheet: function(userId, active){
      if(active && (userId == Session.get('LdapId'))){
    		return true;
    	}
    	return false;
    }
    
});