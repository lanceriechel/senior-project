Template.activeTimesheets.helpers({
    getSunday: function(){
        
		var d = new Date();

		d.setDate((d.getDate() - (d.getDay() + 6) % 7 )- 1);
		return d.toLocaleDateString();
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
    ActiveTimesheet: function(userId, active){
    	if(active && (userId == Meteor.userId())){
    		return true;
    	}
    	return false;
    }
    
});

Template.activeTimesheets.events({
    'click button': function(event){
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
	    			'concerns': '',
	    			'submitted': false
	    		}
	    	);
	        return true;
		}else{
			$('#addWeeklyTimesheet').tooltip({
	            title: 'Already Active Weekly Timesheet',
	            trigger: 'hover',
	            animation: false
	        });
	        $('#addWeeklyTimesheet').tooltip('show');
			return false;
		}
	}
});

Template.timesheetInfo.events = {
    'click button': function(event){
    	Session.set('current_page', 'selected_timesheet');
    	var row = event.currentTarget.parentNode.parentNode;
    	var startDate = $(row).find('#StartDate')[0].value;

    	Session.set('startDate', startDate);

    },
};

Template.SelectedTimesheet.events = {
    'click button': function(event){
    	var start = Session.get('startDate');
    	//alert(start);

    },
};

Template.projectComments.helpers({
	'name' : function(projectID){
	    var name = ChargeNumbers.findOne({'id' : projectID});
	    return name['name'];
	},	
	next: function(projectID) {
		var date = Session.get("startDate");
		var user = Meteor.userId();
		var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

		var prEntriesArr = sheet['projectEntriesArray'];

	    var index=0;
	    for(i=0 ; i<prEntriesArr.length ; i++){
	        if(prEntriesArr[i]['projectID'] == projectID){
	            index = i;
	        }
   		 }
   		 // alert(sheet['projectEntriesArray'][index]['next']);
		return sheet['projectEntriesArray'][index]['next'];
	},
	issues: function(projectID) {
		var date = Session.get("startDate");
		var user = Meteor.userId();
		var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

		var prEntriesArr = sheet['projectEntriesArray'];

	    var index=0;

	    for(i=0 ; i<prEntriesArr.length ; i++){
	        if(prEntriesArr[i]['projectID'] == projectID){
	            index = i;
	        }
	    }

		return sheet['projectEntriesArray'][index]['issues'];
	}
});

Template.SelectedTimesheet.helpers({
	row: function(){	
		var date = Session.get("startDate");
		var user = Meteor.userId();
		var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

		var projectEntries = sheet['projectEntriesArray'];

		var rows = [];

		for(i = 0; i < projectEntries.length; i++){
			var project = projectEntries[i]['projectID'];
			var EntryArray = projectEntries[i]['EntryArray'];
			for(j=0; j< EntryArray.length; j++){
				var comment = EntryArray[j]['Comment'];
				var rowID = EntryArray[j]['rowID'];
				var hours = EntryArray[j]['hours'];
				rows.push({
					'project' : project,
					'sunday' : hours[0],
					'monday' : hours[1],
					'tuesday' : hours[2],
					'wednesday' : hours[3],
					'thursday' : hours[4],
					'friday' : hours[5],
					'saturday' : hours[6],
					'comment' :  comment,
					'rowID' : rowID
				});
			}
		}

		return rows;
	},
	project: function(){
		var date = Session.get("startDate");
		var user = Meteor.userId();
		var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

		var projectEntries = sheet['projectEntriesArray'];

		var projects = [];

		for(i = 0; i < projectEntries.length; i++){
			var project = projectEntries[i]['projectID'];
			projects.push({
				'project' : project
			});
		}

		return projects;
	}
});

Template.projectListDropDown.helpers({
    employees: function(project) {
    	// alert(project);
        return DatabaseService.getProjects();
    },
});

Template.lastSection.helpers({
    genComment: function() {
		var date = Session.get("startDate");
		var user = Meteor.userId();
    	var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

    	return sheet['generalComment'];
    },
    concerns: function() {
		var date = Session.get("startDate");
		var user = Meteor.userId();
    	var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

    	return sheet['concerns'];

    }
});

Template.projectListDropDown.rendered = function(){
    var id = $(this.firstNode).parent().attr('id');
    $(this.firstNode).find("#"+id).prop("selected", true);
};

Template.lastSection.events = {
	'blur .commentRow': function(event){

     var row = event.currentTarget;
     var gen_comment = $(row).find('#generalComment')[0].value;
     var concerns = $(row).find('#concerns')[0].value;

     TimeSheetService.removeErrorClasses(row, ['#concerns','#generalComment']);

     ActiveDBService.updateCommentsInTimeSheet(Session.get("startDate"), Meteor.userId(), gen_comment, concerns);
  },

  'click button': function(event){

     ActiveDBService.submitTimesheet(Session.get("startDate"), Meteor.userId());
  }
};

Template.projectComments.events = {
	'blur .projectCommentsRow': function(event){

		var row = event.currentTarget;
     	var issues = $(row).find('#Issues')[0].value;
     	var next = $(row).find('#Next')[0].value;
     	var projectID = $(row).find('#project_comments_name')[0].parentNode.id;
     	
     	ActiveDBService.updateProjectCommentsTimeSheet(Session.get("startDate"), Meteor.userId(), projectID, issues, next);
	}
};
