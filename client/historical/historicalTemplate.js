Template.historyHeader.helpers({
	getTimesheets: function () {
		var userId = Session.get('LdapId');
		var year = Session.get('year');
		var timesheetsMap = {};
		var timesheets = [];

		TimeSheet.find({'userId': userId}).forEach(
			function (u) {
				timesheetYear = u.startDate.split('/')[2];
				if (timesheetYear == year) {
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

Template.historyYearSelect.helpers({
	getYears: function () {
    	var userId = Session.get('LdapId');
		var years = [];

		TimeSheet.find({'userId': userId}).forEach(
			function (u) {
				var timesheetYear = u.startDate.split('/')[2];
				if (!(timesheetYear in years)) {
					years[timesheetYear] = {year: timesheetYear};
				}
			});
		return years;
	},

});

Template.historyYearSelect.events({
    'click button': function(event){
    	Session.set('current_page', 'historical_page');
    	var year = event.currentTarget.innerHTML;

    	Session.set('year', year);
    }
});

Template.historyInfo.events({
    'click button': function(event){
    	Session.set('current_page', 'historical_timesheet');
    	var row = event.currentTarget.parentNode.parentNode;
    	var startDate = $(row).find('#StartDate')[0].value;

    	Session.set('startDate', startDate);

    }
});

Template.SelectedHistoryTimesheet.helpers({
	row: function(){

		var date = Session.get("startDate");
		var user = Session.get('LdapId');
		var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

		var projectEntries = sheet['projectEntriesArray'];

		var rows = [];
		var maxRow=-1;
		for(i = 0; i < projectEntries.length; i++){
			var project = projectEntries[i]['projectID'];
			var sentBack;
			if(projectEntries[i]['SentBack']){
				sentBack = "sentBack";
			}else{
				sentBack = "notSentBack";
			}

			var EntryArray = projectEntries[i]['EntryArray'];
			for(j=0; j< EntryArray.length; j++){
				var comment = EntryArray[j]['Comment'];
				var rowID = EntryArray[j]['rowID'];
				if (rowID > maxRow){
					maxRow=rowID;
				}
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
					'rowID' : rowID,
					'sentBack' :sentBack
				});
			}
		}

		function compare(a,b) {
			if (a.rowID < b.rowID)
				return -1;
			if (a.rowID > b.rowID)
				return 1;
			return 0;
		}
		Session.set("max_Row", maxRow);
		return rows.sort(compare);
	},
	project: function(){
		var date = Session.get("startDate");
		var user = Session.get('LdapId');
		var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

		var projectEntries = sheet['projectEntriesArray'];

		var projects = [];

		for(i = 0; i < projectEntries.length; i++){
			var project = projectEntries[i]['projectID'];
			var sentBack;
			if(projectEntries[i]['SentBack']){
				sentBack = "sentBack";
			}else{
				sentBack = "notSentBack";
			}
			projects.push({
				'project' : project,
				'sentBack' : sentBack
			});
		}

		return projects;
	},
	date: function(){
		var date = Session.get("startDate");
		return date;
	},
	timesheethack: function(){
		var date = Session.get("startDate");
		var user = Session.get('LdapId');
		var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

		var projectEntries = sheet['projectEntriesArray'];

		var sentBack = "notSentBack";
		for(i = 0; i < projectEntries.length; i++){
			if(projectEntries[i]['SentBack']){
				sentBack = "sentBack";
			}
		}
		var returned = [];
		returned.push({ 'sentBack' : sentBack });

		return returned;
	}
});

Template.historyProjectHours.helpers({
    'name' : function(projectID){
      var name = ChargeNumbers.findOne({'id' : projectID});
      return name['name'];
    }
});

Template.historyProjectComments.helpers({
	'name' : function(projectID){
	    var name = ChargeNumbers.findOne({'id' : projectID});
	    return name['name'];
	},	
	next: function(projectID) {
		var date = Session.get("startDate");
		var user = Session.get('LdapId');
		var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

		var prEntriesArr = sheet['projectEntriesArray'];

	    var index=0;
	    for(i=0 ; i<prEntriesArr.length ; i++){
	        if(prEntriesArr[i]['projectID'] == projectID){
	            index = i;
	        }
   		 }
		return sheet['projectEntriesArray'][index]['next'];
	},
	issues: function(projectID) {
		var date = Session.get("startDate");
		var user = Session.get('LdapId');
		var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

		var prEntriesArr = sheet['projectEntriesArray'];

	    var index=0;

	    for(i=0 ; i<prEntriesArr.length ; i++){
	        if(prEntriesArr[i]['projectID'] == projectID){
	            index = i;
	        }
	    }

		return sheet['projectEntriesArray'][index]['issues'];
	},
  message: function(projectID) {
    var date = Session.get("startDate");
    var user = Session.get('LdapId');
    var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

    var prEntriesArr = sheet['projectEntriesArray'];

      var index=0;

      for(i=0 ; i<prEntriesArr.length ; i++){
          if(prEntriesArr[i]['projectID'] == projectID){
              index = i;
          }
      }

    return sheet['projectEntriesArray'][index]['rejectMessage'];
  }
});

Template.historyLastSection.helpers({
    genComment: function() {
  		var date = Session.get("startDate");
      var user = Session.get('LdapId');
      var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

      if(sheet['submitted']){
        $('#generalComment').attr('disabled', 'disabled');
      }

      return sheet['generalComment'];
    },
    concerns: function() {
  		var date = Session.get("startDate");
      var user = Session.get('LdapId');
    	var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

      if(sheet['submitted']){
        $('#concerns').attr('disabled', 'disabled');
      }

    	return sheet['concerns'];

    }
});

Template.historyLog.helpers({
    revisions : function(){
    	var revisionArray = [];
    	var date = Session.get("startDate");
		var user = Session.get('LdapId');
    	var revisions = TimeSheet.findOne({'startDate':date,'userId':user}).revision;
    	revisions.forEach(function (r) {
    		var timestamp = r.timestamp.getDate() + "/"
                + (r.timestamp.getMonth()+1)  + "/" 
                + r.timestamp.getFullYear() + " @ "  
                + r.timestamp.getHours() + ":"  
                + r.timestamp.getMinutes();

            var message = "";
            if (r.type == "approval") {
            	message = r.manager + " approved " + r.totalHours + " hours for project " + r.project + ".";
            } else if (r.type == "rejection") {
            	message = r.manager + " rejected " + r.totalHours + " hours for project " + r.project + " with message \"" + r.comment + "\".";
            } else if (r.type == "submission") {
            	message = r.employee + " submitted " + r.totalHours + " hours for project " + r.project + ".";
            };

            revisionArray.push({
            	'timestamp':timestamp,
            	'message':message
            });
    	});
		return revisionArray;
    }
});