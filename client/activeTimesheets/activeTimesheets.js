Template.activeTimesheets.helpers({
    getSunday: function () {
        
		var d = new Date();

		d.setDate((d.getDate() - (d.getDay() + 6) % 7 ) - 1);
		return d.toLocaleDateString();
    },
    getTimesheets: function () {
		var userId = Meteor.userId(),
			timesheetsMap = {},
			timesheets = [];
		ActiveDBService.getActiveTimeSheetsForUser(userId).forEach(
			function(u) {
				var days = [];
				if (u.type) {
					days = [0, 0, 0, 0, 0, 0, 0];
				}else{
					days = u.EntryArray;
				}
				if (u.startDate in timesheetsMap){
					var current = timesheets[timesheetsMap[u.startDate]];
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
				}else{
					timesheetsMap[u.startDate] = timesheets.length;
					timesheets[timesheetsMap[u.startDate]] = {
						startDate:u.startDate,sun: days[0],mon: days[1],tue: days[2],
						wed: days[3],thu: days[4],fri: days[5],sat: days[6]
					};
				}
			});
		return timesheets;
    },
    loggedIn: function(){
    	alert(Meteor.userId());
    	if(Meteor.userId()){
    		alert(1);
    		return true;
    	}
    	alert(2);
    	return false;
    },
    ActiveTimesheet: function(userId, active){
    	if(active && (userId == Meteor.userId())){
    		return true;
    	}
    	return false;
    }
    
});

Template.timesheetInfo.events = {
    'click button': function(event){
    	Session.set('current_page', 'selected_timesheet');
    	var row = event.currentTarget.parentNode.parentNode;
    	var startDate = $(row).find('#StartDate')[0].value;

    	Session.set('startDate', startDate);

    }
};

Template.SelectedTimesheet.events = {
    'click button': function(event){
    	var start = Session.get('startDate');
    	//alert(start);

    },
};

Template.projectListDropDown.helpers({
    employees: function() {
        return DatabaseService.getProjects();
    }
});