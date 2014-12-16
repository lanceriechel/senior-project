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
    loggedIn: function(){
      var userId = Session.get('LdapId');
      if(userId){
    		alert(1);
    		return true;
    	}
    	alert(2);
    	return false;
    },
    ActiveTimesheet: function(userId, active){
      if(active && (userId == Session.get('LdapId'))){
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
      var userId = Session.get('LdapId');


	    	var err = TimeSheet.insert(
	    		{
	    			'startDate': d,
	    			'endDate': d2,
	    			'userId': userId,
	    			'active': 1,
	    			'revision': [],
	    			'projectEntriesArray': [],
	    			'type' : 1,
	    			'generalComment': 'active timesheet button',
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
    },
};

Template.projectComments.helpers({
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
   		 // alert(sheet['projectEntriesArray'][index]['next']);
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

Template.SelectedTimesheet.helpers({
	row: function(){	
    //var id = Session.get("rows_have_been_update");
    //console.log("Test");

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
  timesheethack: function(){ //This is a bit of a hack to pass the information of whether a timesheet
                             //needs to be revised to the adding-row code.  Although this is an #each
                             //function, it will only ever return the one field.  
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

Template.SelectedTimesheet.rendered = function(){
	var date = Session.get("startDate");
  var user = Session.get('LdapId');
  var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

  if(sheet['submitted']){
		$('.enterable').attr('disabled', 'disabled');
    $('.sentBack').attr('disabled', false);
	}
};

Template.projectListDropDown.helpers({
    employees: function(projectSelected) {

      var date = Session.get("startDate");
      var userId = Session.get('LdapId');
      var sheet = TimeSheet.findOne({'startDate':date,'userId':userId});

      var projectEntries = sheet['projectEntriesArray'];

      var projectsNotAllowed = [];

      for(i = 0; i < projectEntries.length; i++){
        var project = projectEntries[i]['projectID'];
        var sentBack;
        if((projectEntries[i]['Approved'] || !projectEntries[i]['SentBack']) && sheet['submitted']){
          projectsNotAllowed.push(project);

        }
      }
      var user = Meteor.users.findOne({_id: Session.get('LdapId')});
      var projects =  ChargeNumbers.find({id: { $in : user['projects'] } });
      var returnedProjects = [];
      var selected = false;

      projects = projects.fetch();


      projects.forEach( function(p){
        if(projectSelected == p['id']){
          selected = true;
        }

        if(!($.inArray(p['id'], projectsNotAllowed) > -1)){
          returnedProjects.push({
             'id' : p['id'],
             'name' : p['name'],
             'selected' : selected
          });

        }else if(projectSelected == p['id'] && ($.inArray(projectSelected, returnedProjects) == -1)){
            returnedProjects.push({
             'id' : p['id'],
             'name' : p['name'],
             'selected' : selected
          });
       
        }
        selected = false;
      });

      return returnedProjects;
    },
    isSelected: function(selected, name){
     // alert(selected + ''+name)
      if(selected){
        return true;
      }
      return false;
    }
});

Template.lastSection.helpers({
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

     ActiveDBService.updateCommentsInTimeSheet(Session.get("startDate"), Session.get('LdapId'), gen_comment, concerns);
  },

  'click button': function(event){

     ActiveDBService.submitTimesheet(Session.get("startDate"), Session.get('LdapId'));
     Session.set('current_page', 'time_sheet');
  }
};

Template.projectComments.events = {
	'blur .projectCommentsRow': function(event){

		var row = event.currentTarget;
   	var issues = $(row).find('#Issues')[0].value;
   	var next = $(row).find('#Next')[0].value;
   	var projectID = $(row).find('#project_comments_name')[0].parentNode.id;
   	
   	ActiveDBService.updateProjectCommentsTimeSheet(Session.get("startDate"), Session.get('LdapId'), projectID, issues, next);
	}
};

Template.projectHoursFilled.events = {
  'blur .filledRow': function(event){

     var row = event.currentTarget.parentNode;
     var comment_t = $(row).find('#Comment')[0].value;
     var sunday_t = $(row).find('#Sunday')[0].value;
     var monday_t = $(row).find('#Monday')[0].value;
     var tuesday_t = $(row).find('#Tuesday')[0].value;
     var wednesday_t = $(row).find('#Wednesday')[0].value;
     var thursday_t = $(row).find('#Thursday')[0].value;
     var friday_t = $(row).find('#Friday')[0].value;
     var saturday_t = $(row).find('#Saturday')[0].value;
     var rowID = $(row).attr('id');
     var projectIndex = $(row).find('#project_select')[0].selectedIndex;
     var projectID = $(row).find('#project_select')[0].children[projectIndex].id;

     TimeSheetService.removeErrorClasses(row, ['#Comment','#Sunday','#Monday','#Tuesday','#Wednesday','#Thursday','#Friday','#Saturday','#projectName']);

     if(TimeSheetService.ensureValidEntry(row, comment_t, sunday_t, monday_t,tuesday_t, wednesday_t, thursday_t, friday_t, saturday_t, projectID)){
        }
           /*
           Update Database
           This will update the database correctly when the projectHoursFilled is fixed.-Dan
           */
            ActiveDBService.updateRowInTimeSheet(Session.get("startDate"), Session.get('LdapId'), projectID,
                comment_t,
                sunday_t,
                monday_t,
                tuesday_t,
                wednesday_t,
                thursday_t,
                friday_t,
                saturday_t,
                rowID
            );
          //Session.set("rows_have_been_update", projectID);

      }
    ,
    'click button': function(event){
      var row = event.currentTarget.parentNode.parentNode;
      //var projectIndex = $(row).find('#project_select')[0].selectedIndex;
      //var options = $(row).find('#project_select')[0];
      //var projectID = options[options.selectedIndex].id;
      var projectID = $(row).find('#project_select')[0].parentNode.id;

      var comment_t = $(row).find('#Comment')[0].value;
      var sunday_t = $(row).find('#Sunday')[0].value;
      var monday_t = $(row).find('#Monday')[0].value;
      var tuesday_t = $(row).find('#Tuesday')[0].value;
      var wednesday_t = $(row).find('#Wednesday')[0].value;
      var thursday_t = $(row).find('#Thursday')[0].value;
      var friday_t = $(row).find('#Friday')[0].value;
      var saturday_t = $(row).find('#Saturday')[0].value;

      var rowID = $(row).attr('id');
      var date = Session.get("startDate");
		  var user = Session.get('LdapId');
    	var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

   		if(!sheet['submitted'] || TimeSheetService.checkSentBack()){
        	ActiveDBService.removeRowInTimeSheet(Session.get("startDate"), Session.get('LdapId'), rowID, projectID);
    	}
    }
}

Template.projectHoursFilled.helpers({
    'name' : function(projectID){
      var name = ChargeNumbers.findOne({'id' : projectID});
      return name['name'];
    }
});

Template.projectHours.events = {
    'click button': function(event){

       var row = event.currentTarget.parentNode.parentNode;
       var comment_t = $(row).find('#Comment')[0].value;
       var sunday_t = $(row).find('#Sunday')[0].value;
       var monday_t = $(row).find('#Monday')[0].value;
       var tuesday_t = $(row).find('#Tuesday')[0].value;
       var wednesday_t = $(row).find('#Wednesday')[0].value;
       var thursday_t = $(row).find('#Thursday')[0].value;
       var friday_t = $(row).find('#Friday')[0].value;
       var saturday_t = $(row).find('#Saturday')[0].value;

        // I added this so we can retrieve the selected project's ID so we can add it to the Database
        var projectIndex = $(row).find('#project_select')[0].selectedIndex;
        var projectID = $(row).find('#project_select')[0].children[projectIndex].id;

        Session.get("max_Row");
        var rowID = Session.get("max_Row")+1;
        Session.set("max_Row", rowID);
        $(row).attr('id',rowID);


        TimeSheetService.removeErrorClasses(row, ['#Comment','#Sunday','#Monday','#Tuesday','#Wednesday','#Thursday','#Friday','#Saturday']);
  
     if(TimeSheetService.ensureValidEntry(row, comment_t, sunday_t, monday_t,tuesday_t, wednesday_t, thursday_t, friday_t, saturday_t)){
            
            /*
            Database Entry
             Adding entry to the Database correctly. -Dan

            */
      var date = Session.get("startDate");
		  var user = Session.get('LdapId');
    	var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

    	if(!sheet['submitted'] || TimeSheetService.checkSentBack()){
         ActiveDBService.addRowToTimeSheet(Session.get("startDate"),Session.get('LdapId'), projectID,
             comment_t,
             sunday_t,
             monday_t,
             tuesday_t,
             wednesday_t,
             thursday_t,
             friday_t,
             saturday_t,
             rowID);
        }
     }

            $(row).find('#Comment')[0].value = '';
            $(row).find('#Sunday')[0].value = '0';
            $(row).find('#Monday')[0].value = '0';
            $(row).find('#Tuesday')[0].value = '0';
            $(row).find('#Wednesday')[0].value = '0';
            $(row).find('#Thursday')[0].value = '0';
            $(row).find('#Friday')[0].value = '0';
            $(row).find('#Saturday')[0].value = '0';


    }
};

TimeSheetService = {
   removeErrorClasses: function(row, selectors) {
     for(var i = 0; i<selectors.length; i++){
         var item = $(row).find(selectors[i]);
         item.parent().removeClass('has-error');
         item.tooltip('destroy');
     }
   },
   checkSentBack: function(){
    var date = Session.get("startDate");
    var user = Session.get('LdapId');
    var sheet = TimeSheet.findOne({'startDate':date,'userId':user});

    var projectEntries = sheet['projectEntriesArray'];

    var sentBack = false;
    for(i = 0; i < projectEntries.length; i++){
      if(projectEntries[i]['SentBack']){
        sentBack = true;
      }
    }
    return sentBack;
   },
   addError: function(row, selector, message){
      
     $(row).find(selector).parent().addClass('has-error');
     $(row).find(selector).tooltip({
       title: message,
       trigger: 'hover',
       animation: false
     });
     $(row).find(selector).tooltip('show');
   },
    
    ensureValidEntry: function(row, comment_t, sunday_t, monday_t,tuesday_t, wednesday_t, thursday_t, friday_t, saturday_t,projectID){
       
       var valid = true;
       if(comment_t === ''){
          TimeSheetService.addError(row, '#Comment', "Description is Required");
          valid = false;
       }

        if(projectID === ''){         
          TimeSheetService.addError(row, '#projectName', "Field Cannot be Empty");
          valid = false;
       }
       if(isNaN(sunday_t)){
          TimeSheetService.addError(row, '#Sunday', "Field is Not a Number");
          valid = false;    
       } 
       if(sunday_t % .25 != 0){
          TimeSheetService.addError(row, '#Sunday', "Field Must be a Multiple of .25");
          valid = false;    
       }
       if(isNaN(monday_t)){
          TimeSheetService.addError(row, '#Monday', "Field is Not a Number");
          valid = false;       
       }
       if(monday_t % .25 != 0){
          TimeSheetService.addError(row, '#Monday', "Field Must be a Multiple of .25");
          valid = false;    
       }
       if(isNaN(tuesday_t)){
          TimeSheetService.addError(row, '#Tuesday', "Field is Not a Number");
          valid = false;
       }
       if(tuesday_t % .25 != 0){
          TimeSheetService.addError(row, '#Tuesday', "Field Must be a Multiple of .25");
          valid = false;    
       }
       if(isNaN(wednesday_t)){
          TimeSheetService.addError(row, '#Wednesday', "Field is Not a Number");
          valid = false;
       }
       if(wednesday_t % .25 != 0){
          TimeSheetService.addError(row, '#Wednesday', "Field Must be a Multiple of .25");
          valid = false;    
       }
       if(isNaN(thursday_t)){
          TimeSheetService.addError(row, '#Thursday', "Field is Not a Number");
          valid = false;
       }
       if(thursday_t % .25 != 0){
          TimeSheetService.addError(row, '#Thursday', "Field Must be a Multiple of .25");
          valid = false;    
       }
       if(isNaN(friday_t)){
          TimeSheetService.addError(row, '#Friday', "Field is Not a Number");
          valid = false;
       }
       if(friday_t % .25 != 0){
          TimeSheetService.addError(row, '#Friday', "Field Must be a Multiple of .25");
          valid = false;    
       }
       if(isNaN(saturday_t)){
          TimeSheetService.addError(row, '#Saturday', "Field is Not a Number");
          valid = false;
       }
       if(saturday_t % .25 != 0){
          TimeSheetService.addError(row, '#Saturday', "Field Must be a Multiple of .25");
          valid = false;    
       }
       if(((sunday_t === '')||(sunday_t === '0')) &&
          ((monday_t === '')||(monday_t === '0')) &&
          ((tuesday_t === '')||(tuesday_t === '0')) &&
          ((wednesday_t === '')||(wednesday_t === '0')) &&
          ((thursday_t === '')||(thursday_t === '0')) &&
          ((friday_t === '')||(friday_t === '0')) &&
          ((saturday_t === '')||(saturday_t === '0')))
       {
          TimeSheetService.addError(row, '#Sunday', "At least one day must have time entered");
          TimeSheetService.addError(row, '#Monday', "");
          TimeSheetService.addError(row, '#Tuesday', "");
          TimeSheetService.addError(row, '#Wednesday', "");
          TimeSheetService.addError(row, '#Thursday', "");
          TimeSheetService.addError(row, '#Friday', "");
          TimeSheetService.addError(row, '#Saturday', "");
          valid = false;
       }
       return valid;
    }
};
