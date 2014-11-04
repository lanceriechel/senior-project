Template.activeTimesheets.helpers({
    getSunday: function(){
        
		var d = new Date();

		d.setDate((d.getDate() - (d.getDay() + 6) % 7 )- 1);
		return d.toLocaleDateString();
    },
    weeklyNotSubmitted: function(){
    	if(ActiveDBService.hasActiveNonSubmitted()){
			var d = new Date();
			d.setDate((d.getDate() - (d.getDay() + 6) % 7 ) - 1);
			var d2 = new Date();
			d2.setDate((d2.getDate() - (d2.getDay() + 6) % 7 ) + 6);
			d = d.toLocaleDateString();
			d2 = d2.toLocaleDateString();
			userId = Meteor.userId();


	    	var err = TimeSheet.insert(
	    		{
	    			'startDate': d,
	    			'endDate': d2,
	    			'userId': userId,
	    			'active': 1,
	    			'revision': [],
	    			'projectEntriesArray': [],
	    			'type' : 1,
	    			'generalComment': '',
	    			'submitted': false
	    		}
	    	);
	        return true;
    	}else{
    		return false;
    	}
    },
    timesheet: function(){
    	return ActiveDBService.getActiveTimesheets(); 
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
    
});

Template.timesheetInfo.events = {
    'click button': function(event){
    	Session.set('current_page', 'selected_timesheet');

    },
};