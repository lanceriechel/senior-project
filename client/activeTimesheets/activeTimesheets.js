Template.activeTimesheets.helpers({
  getSunday: function(){
    /*
      Returns the Sunday of the current week
    */   
  	return generalHelpers.getSunday();
  },
	getTimesheets: function () {
    /*
      Returns all active timesheets (usually only one, unless another has been rejected)
    */
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
        //Code below adds up the total hours for each day for the timesheet selection page
				for (var pIndex in u.projectEntriesArray) {
					for (var eIndex in u.projectEntriesArray[pIndex].EntryArray){
						var entry = u.projectEntriesArray[pIndex].EntryArray[eIndex],
							days = entry.hours,
							current = timesheets[timesheetsMap[u.startDate]];
						timesheets[timesheetsMap[u.startDate]] = {
							startDate: u.startDate,
							sun: (parseFloat(days[0]) || 0) + (parseFloat(current.sun) || 0),
							mon: (parseFloat(days[1]) || 0) + (parseFloat(current.mon) || 0),
							tue: (parseFloat(days[2]) || 0) + (parseFloat(current.tue) || 0),
							wed: (parseFloat(days[3]) || 0) + (parseFloat(current.wed) || 0),
							thu: (parseFloat(days[4]) || 0) + (parseFloat(current.thu) || 0),
							fri: (parseFloat(days[5]) || 0) + (parseFloat(current.fri) || 0),
							sat: (parseFloat(days[6]) || 0) + (parseFloat(current.sat) || 0)
						};
					}
				}
			});
		return timesheets;
	} 
});

Template.timesheetInfo.events = {
  'click button': function(event){
    /*
      This sets the current page to a specific timesheet, as well as set a session variable
      that the code checks so it knows what timesheet to bring up
    */
  	Session.set('current_page', 'selected_timesheet');
  	var row = event.currentTarget.parentNode.parentNode;
  	var startDate = $(row).find('#StartDate')[0].value;

  	Session.set('startDate', startDate);
  },
};

/*
 Returns the date string for the given day index
 */
day_date = function (dayIndex){
    var date = new Date(Session.get("startDate"));

    date.setDate(date.getDate()+dayIndex);

    return " " + (date.getMonth() + 1) + "/" + date.getDate();
}

Template.daysOfWeek.helpers({
    day_date : function(dayIndex){
        return day_date(dayIndex);
    }
});

Template.projectComments.helpers({
    'name': function (projectId) {
        /*
         Returns the name of a project given its projectID (which is unique).
         */
        var name = ChargeNumbers.findOne({'_id': projectId});
        return name['name'];
    },
    hours: function (projectId){
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

        var projectEntries = sheet['projectEntriesArray'];

        var total = 0;

       
        for (var i = 0; i < projectEntries.length; i++) {
            if (projectEntries[i].projectId==projectId){
                var EntryArray = projectEntries[i]['EntryArray'];
            
                //console.log("EntryArray Length: " + EntryArray.length);
                for (var j = 0; j < EntryArray.length; j++) {
                    var hours = EntryArray[j]['hours'];
                    //console.log("Hours Length: "+ hours.length);
                    for (var k = 0; k < hours.length; k++){
                        //console.log("Adding: "+ parseInt(hours[i]));
                        total += parseFloat(hours[k]) || 0;
                    }
                
                }
            }
        }
            
        //console.log("Total: "+ total);
        return total;
    },
    next: function (projectId) {
        /*
         Returns the 'Goals for Next Week' field for the selected timesheet
         */
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

        var prEntriesArr = sheet['projectEntriesArray'];

        var index = -1;
        for (var i in prEntriesArr) {
            if (prEntriesArr[i]['projectId'] == projectId) {
                index = i;
            }
        }
        if (index == -1) {
            return '';
        }
        return sheet['projectEntriesArray'][index]['next'];
    },
    issues: function (projectId) {
        /*
         Returns the 'This Weeks Issues' field for the selected timesheet
         */
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

        var prEntriesArr = sheet['projectEntriesArray'];

        var index = -1;

        for (i = 0; i < prEntriesArr.length; i++) {
            if (prEntriesArr[i]['projectId'] == projectId) {
                index = i;
            }
        }

        if (index == -1) {
            return '';
        }

        return sheet['projectEntriesArray'][index]['issues'];
    },
    message: function (projectId) {
        /*
         Returns the 'Manager Feedback' field for the selected timesheet
         */
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

        var prEntriesArr = sheet['projectEntriesArray'];

        var index = -1;

        for (i = 0; i < prEntriesArr.length; i++) {
            if (prEntriesArr[i]['projectId'] == projectId) {
                index = i;
            }
        }

        if (index == -1) {
            var comment = '';
            for (var i in sheet.projectApprovalArray){
                if (sheet.projectApprovalArray[i].projectId == projectId){
                    comment = sheet.projectApprovalArray[i].comment;
                }
            }
            return comment;
        }

        return sheet['projectEntriesArray'][index]['rejectMessage'];
    }
});

Template.totals.helpers({
    getDayTotal: function(day) {
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        var total = 0;
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

        if (!sheet){
            return;
        }

        var projectEntries = sheet['projectEntriesArray'];
        for (var i = 0; i < projectEntries.length; i++) {
            var EntryArray = projectEntries[i]['EntryArray'];
            
            for (var j = 0; j < EntryArray.length; j++) {
                var hours = EntryArray[j]['hours'];
                total += parseFloat(hours[day])|| 0;
            }
        }
        return total;
    },

    getWeekTotal: function(){
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        var total = 0;
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

        if (!sheet){
            return;
        }

        var projectEntries = sheet['projectEntriesArray'];
        //console.log("projectsEntries Length: " + projectEntries.length);
        for (var i = 0; i < projectEntries.length; i++) {
            var EntryArray = projectEntries[i]['EntryArray'];
            
            //console.log("EntryArray Length: " + EntryArray.length);
            for (var j = 0; j < EntryArray.length; j++) {
                var hours = EntryArray[j]['hours'];
                //console.log("Hours Length: "+ hours.length);
                for (var k = 0; k < hours.length; k++){
                    //console.log("Adding: "+ parseInt(hours[i]));
                    total += parseFloat(hours[k]) || 0;
                }
                
            }
        }
        //console.log("Total: "+ total);
        return total;
    }

});

Template.SelectedTimesheet.helpers({
    row: function () {
        //var id = Session.get("rows_have_been_update");
        //console.log("Test");

        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});
        if (!sheet) return [];

        var projectEntries = sheet['projectEntriesArray'];

        var rows = [];
        var maxRow = -1;
        var pSentBacks = {};
        for (var i in sheet.projectApprovalArray){
            pSentBacks[sheet.projectApprovalArray[i].projectId] = sheet.projectApprovalArray[i].sentBack;
        }
        for (i = 0; i < projectEntries.length; i++) {
            var project = projectEntries[i]['projectId'];
            var sentBack;
            //sentBack means the manager has rejected it, so it should be left unlocked
            if (pSentBacks[project]) {
                sentBack = "sentBack";
            } else {
                sentBack = "notSentBack";
            }

            if (data){
                if (project == data.project){
                    sentBack = "sentBack";
                }else{
                    sentBack = "notSentBack";
                }
            }

            var EntryArray = projectEntries[i]['EntryArray'];
            for (j = 0; j < EntryArray.length; j++) {
                var comment = EntryArray[j]['Comment'];
                var rowID = EntryArray[j]['rowID'];
                if (rowID > maxRow) {
                    maxRow = rowID;
                }
                var hours = EntryArray[j]['hours'];
                rows.push({
                    'project': project,
                    'sunday': hours[0] == 0 ? '' : hours[0],
                    'monday': hours[1] == 0 ? '' : hours[1],
                    'tuesday': hours[2] == 0 ? '' : hours[2],
                    'wednesday': hours[3] == 0 ? '' : hours[3],
                    'thursday': hours[4] == 0 ? '' : hours[4],
                    'friday': hours[5] == 0 ? '' : hours[5],
                    'saturday': hours[6] == 0 ? '' : hours[6],
                    'comment': comment,
                    'rowID': rowID,
                    'sentBack': sentBack
                });
            }
        }

        function compare(a, b) {
            if (a.rowID < b.rowID)
                return -1;
            if (a.rowID > b.rowID)
                return 1;
            return 0;
        }

        Session.set("max_Row", maxRow);
        return rows.sort(compare);
    },
    project: function () {
        /*
         Returns projectIDs of all projects in a timesheet.
         Also includes a boolean if that project has been sent back by the manager.
         The field will be locked if the project has not been sent back (it is pending or approved).
         */
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});
        if (!sheet) return;
        var projectEntries = sheet['projectEntriesArray'];
        var projects = [];
        var pSentBacks = {};
        for (var i in sheet.projectApprovalArray){
            pSentBacks[sheet.projectApprovalArray[i].projectId] = sheet.projectApprovalArray[i].sentBack;
        }
        var managerEdit = "notSentBack";
        for (i = 0; i < projectEntries.length; i++) {
            var project = projectEntries[i]['projectId'];
            var sentBack;
            if (pSentBacks[project]) {
                sentBack = "sentBack";
            } else {
                sentBack = "notSentBack";
            }

            if (data){
                if (project == data.project){
                    sentBack = "sentBack";
                }else{
                    sentBack = "notSentBack";
                }
            }

            projects.push({
                'project': project,
                'sentBack': sentBack,
                'managerEdit': managerEdit
            });

            pSentBacks[project] = false;
        }

        for(var i in pSentBacks){
            if (pSentBacks[i] && (pSentBacks[i].sentBack || pSentBacks[i].approved)) {
                projects.push({
                    'project': pSentBacks[i].projectId,
                    'sentBack': pSentBacks[i].sentBack ? "sentBack" : "notSentBack",
                    'managerEdit': managerEdit
                });
            }
        }

        return projects;
    },
    date: function () {
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});
        if (!sheet) return;
        return date + " - " + sheet.endDate;
    },
    employeeName: function () {
        var data = Session.get('editing-user-page');
        return data.username.toUpperCase();
    },
    isEditing: function () {
        return Session.get('editing-user-page');

    },
    timesheethack: function () {
        /*
         This is a bit of a hack to pass the information of whether a timesheet
         needs to be revised to the adding-row code.  Although this is an #each
         function, it will only ever return the one field.
         */
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});
        if (!sheet) return;

        var sentBack = "notSentBack";
        if (data){
            sentBack = "sentBack";
        }else {
            if(sheet.globalSentBack){
                sentBack = "sentBack";
            }
        }

        var returned = [];
        returned.push({'sentBack': sentBack});

        return returned;
    }
});

Template.SelectedTimesheet.events ={
'click #back': function(event){
    /*
      This sets the current page to the general list of all available timesheets
    */
    Session.set('current_page', 'time_sheet');
  },
};

Template.SelectedTimesheet.rendered = function () {
    /*
     Logic to decide which fields in a timesheet are editable, depending on whether the timesheet is
     submitted or not, and also whether projects were sent back.
     */
    var date = Session.get("startDate");
    var user = Session.get('LdapId');
    var data = Session.get('editing-user-page');
    if (data){
        var userO = Meteor.users.findOne({username : data.username});
        if (userO){
            user = userO._id;
        }
    }
    var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

    if (sheet && sheet['submitted']) {
        $('.enterable').prop('disabled', true);
        $('.sentBack').prop('disabled', false);
        if (TimeSheetService.checkSentBack()) {
            $('#submitButton').prop('disabled', false);
        }
    }

};

Template.projectListDropDown.helpers({
    projectsDropdown: function (projectSelected) {
        /*
         Populate the dropdowns on the left side to all the projects that a user is currently working on.
         Projects are not added to the list if the user is not working on a project.  Projects are also removed from
         the list if the timesheet is submitted and that project is already approved or pending.
         */
        var date = Session.get("startDate");
        var userId = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        var projectsNotAllowed = [];
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                userId = userO._id;
            }
            ChargeNumbers.find({_id : {$ne: data.project}}).forEach(function (proj) {
                projectsNotAllowed.push(proj._id);
            });
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': userId});

        if (!sheet){
            return;
        }

        var projectEntries = sheet['projectEntriesArray'];

        var pSentBacks = {};
        for (var i in sheet.projectApprovalArray){
            pSentBacks[sheet.projectApprovalArray[i].projectId] = sheet.projectApprovalArray[i].sentBack;
        }

        for (var i in sheet.projectApprovalArray){
            if(sheet.projectApprovalArray[i].approved){
                projectsNotAllowed.push(sheet.projectApprovalArray[i].projectId);
            }
        }

        for (i = 0; i < projectEntries.length; i++) {
            var project = projectEntries[i]['projectId'];

            if (data){
                if (project != data.project){
                    projectsNotAllowed.push(project);
                }
            }else {
                if ((sheet.projectApprovalArray[i]['Approved'] || !pSentBacks[project]) && sheet['submitted']) {
                    projectsNotAllowed.push(project);

                }
            }
        }
        var user = Meteor.users.findOne({_id: userId});
        var projectsToList = user.projects;
        sheet.projectApprovalArray.forEach(function (projectApprovalEntry){
            if (($.inArray(projectApprovalEntry.projectId, projectsToList)) == -1){
                //console.log("ADDING: " + projectApprovalEntry.projectId);
                projectsToList.push(projectApprovalEntry.projectId);
            }
        });

        //console.log("Project List: "+ projectsToList);
        var projects = ChargeNumbers.find({_id: {$in: projectsToList}});

        var returnedProjects = [];
        var selected = false;

        projects = projects.fetch();



        // console.log(projectSelected);
        projects.forEach(function (p) {
            if (projectSelected == p['_id']) {
                selected = true;
            }

            if (!($.inArray(p['_id'], projectsNotAllowed) > -1)) {
                returnedProjects.push({
                    'id': p['_id'],
                    'name': p['name'],
                    'selected': selected,
                    'indirect':p['indirect']
                });

            } else if (projectSelected == p['_id'] && ($.inArray(projectSelected, returnedProjects) == -1)) {
                returnedProjects.push({
                    'id': p['_id'],
                    'name': p['name'],
                    'selected': selected,
                    'indirect':p['indirect']
                });

            }
            selected = false;
        });

        returnedProjects.sort(function(a, b) {
            var textA = a.name.toUpperCase();
            var textB = b.name.toUpperCase();
            if((a.indirect && b.indirect) || (!a.indirect && !b.indirect)){
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            }else{
                if(a.indirect){
                    return 1;
                }else{
                    return -1;
                }
            }
        });

        return returnedProjects;
    },
    employees: function (projectSelected) {
    var user = Meteor.users.findOne({_id: Session.get('LdapId')});
    var projects =  ChargeNumbers.find({_id: { $in : user['projects'] } });
    var returnedProjects = [];
    var selected = false;
    projects = projects.fetch();

    projects.forEach( function(p){
      if(projectSelected == p['id']){
        selected = true;
      }
      //Don't allow a project to show up in the dropdown if the user is not working for that project.
      if(!($.inArray(p['_id'], projectsNotAllowed) > -1)){
        returnedProjects.push({
           'id' : p['_id'],
           'name' : p['name'],
           'selected' : selected
        });
      //Still allow a project to be in list if it is currently selected (so it is pending or approved
      //and the row is locked- this is so we can see what project the locked row is for).
      }else if(projectSelected == p['_id'] && ($.inArray(projectSelected, returnedProjects) == -1)){
          returnedProjects.push({
           'id' : p['_id'],
           'name' : p['name'],
           'selected' : selected
        });
      }
      selected = false;
    });
    return returnedProjects;
  }
});

Template.lastSection.rendered = function () {
    /*
     Logic to decide if the comment sections should be enabled
     depending on whether the timesheet is submitted or not,
     and also whether projects are being edited.
     */
    var date = Session.get("startDate");
    var user = Session.get('LdapId');
    var data = Session.get('editing-user-page');
    if (data){
        var userO = Meteor.users.findOne({username : data.username});
        if (userO){
            user = userO._id;
        }
    }
    var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

    if (!sheet) return;

    var disable = data || (sheet['submitted']  && !TimeSheetService.checkSentBack());
    $('#generalComment').prop('disabled', disable);
    $('#concerns').prop('disabled', disable);

};

Template.lastSection.helpers({
    genComment: function () {
    /*
     Returns the 'General Comment' field for the selected timesheet
     */
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

        if (!sheet) return;

        return sheet['generalComment'];
    },
    concerns: function () {
        /*
         Returns the 'Concerns' field for the selected timesheet
         */
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

        if (!sheet) return;

        return sheet['concerns'];

    },
    isEditing: function () {
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

        if (!sheet){
            return false;
        }

        var projectEntries = sheet['projectEntriesArray'];

        var sentBack = sheet.globalSentBack;

        return Session.get('editing-user-page') && sheet.submitted && !sentBack;

    }
});

Template.projectListDropDown.rendered = function () {
    var id = $(this.firstNode).parent().attr('id');
    $(this.firstNode).find("#" + id).prop("selected", true);
};
function hackRefresh(){
    Session.set('current_page', 'faux');
    setTimeout(function () {
        Session.set('current_page', 'selected_timesheet');
    }, 50);
}
function checkNonEmptyAddRow(){
    var row = $('.add_row');
    var comment_t = $(row).find('#Comment')[0].value;
    var sunday_t = parseFloat($(row).find('#Sunday')[0].value, 10);
    var monday_t = parseFloat($(row).find('#Monday')[0].value, 10);
    var tuesday_t = parseFloat($(row).find('#Tuesday')[0].value, 10);
    var wednesday_t = parseFloat($(row).find('#Wednesday')[0].value, 10);
    var thursday_t = parseFloat($(row).find('#Thursday')[0].value, 10);
    var friday_t = parseFloat($(row).find('#Friday')[0].value, 10);
    var saturday_t = parseFloat($(row).find('#Saturday')[0].value, 10);

    var nonEmpty = !(comment_t == '');
    var day_times = [sunday_t, monday_t, tuesday_t, wednesday_t, thursday_t, friday_t, saturday_t];
    for(i in day_times){
        nonEmpty = nonEmpty || (!isNaN(day_times[i]));
    }

    if (nonEmpty) {
        $('#myModal').modal('toggle');
        $('#modal_yes').on("click", function (event){
            Session.set("submission_overide",true);
            $('#submitButton').click();
        });
    }

    return nonEmpty;
}

Template.lastSection.events = {
    'blur .commentRow': function (event) {
            /*
             Handles onBlur effects and saving data to the timesheet.
             */
        var row = event.currentTarget;
        var gen_comment = $(row).find('#generalComment')[0].value;
        var concerns = $(row).find('#concerns')[0].value;
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }

        TimeSheetService.removeErrorClasses(row, ['#concerns', '#generalComment']);

        ActiveDBService.updateCommentsInTimeSheet(Session.get("startDate"), user, gen_comment, concerns, function (){
            $('.toast').addClass('active');
            setTimeout(function () {
                $('.toast').removeClass('active');
            }, 5000);
        });
    },
    'click .submit': function (event) {
        /*
         Submit a timesheet and update its history.
         */
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});
        var employeeName = Meteor.users.findOne({'_id': user}).username;

        var revision = sheet.revision;

        var pSentBacks = {};
        for (var i in sheet.projectApprovalArray){
            pSentBacks[sheet.projectApprovalArray[i].projectId] = sheet.projectApprovalArray[i].sentBack;
        }

        //var tooMuchTime = false;
        //var i = 0;
        //for (i =0; i<7; i++){
        //    if (ActiveDBService.getDayTotal(i)>24){
        //        tooMuchTime = true;
        //    }
        //}
        //if (tooMuchTime){
        //    TimeSheetService.addError(row, '#submitButton', "Cannot have more than 24 hours worked in a Day");
        //}


        var isTimesheetEmpty = true;
        sheet.projectEntriesArray.forEach(function (p) {
            isTimesheetEmpty = false
            var projectId = p.projectId;
            // console.log(projectId);
            var projectName = ChargeNumbers.findOne({'_id': projectId}).name;
            var totalHours = ActiveDBService.getTotalHoursForProject(sheet, projectId);

            if (!sheet.submitted || pSentBacks[projectId]) {
                historyEntry = {
                    'employee': employeeName,
                    'project': projectName,
                    'timestamp': new Date(),
                    'totalHours': totalHours,
                    'type': 'submission'
                };
                revision.unshift(historyEntry);
            }
        });
        if(isTimesheetEmpty){
            // alert('empty');
            var row = event.currentTarget.parentNode;
            TimeSheetService.addError(row, '#submitButton', "Cannot contain 0 hours");

        }else{
            if (!Session.get("submission_overide") && checkNonEmptyAddRow()) return;

            $('#confirmSubmitModal').modal('toggle');
            $('#confirmSubmitModal_yes').on("click", function (event){
                Session.set("submission_overide",false);
                var row = event.currentTarget.parentNode;
                Meteor.call('updateRevision', sheet._id, revision);

                TimeSheetService.removeErrorClasses(row, ['#submitButton']);

                $("input, button, select").attr('disabled','disabled');

                Meteor.call('submitTimesheet', Session.get("startDate"), user);
                // Meteor.call('updateSentBackStatus', Session.get("startDate"), user);
               
                hackRefresh();
                
            });
        }
    },
    'click .approve': function (e) {
        var startDateStr = Session.get("startDate");
        var date = (new Date(startDateStr)).toLocaleDateString();

        var data = Session.get('editing-user-page');
        if (!data){
            return;
        }

        var userId = Meteor.users.findOne({username: data.username})._id;

        var projectId = data.project;
        var projectName = ChargeNumbers.findOne({'_id' : projectId}).name;

        var sheet = TimeSheet.findOne({'startDate':date,'userId':userId,'submitted':true});
        var totalHours = ActiveDBService.getTotalHoursForProject(sheet, projectId);

        var managerName = Meteor.users.findOne({'_id':Session.get('LdapId')}).username;

        var revision = sheet.revision;

        Meteor.call('updateApprovalStatusInTimeSheet', date, userId, projectId, true, "Approved");
        Meteor.call('updateActiveStatusInTimesheet', date, userId, projectId, function (){
            $('.toast').addClass('active');
            setTimeout(function () {
                $('.toast').removeClass('active');
            }, 5000);
        });

        historyEntry = {
            'manager':managerName,
            'project':projectName,
            'timestamp':new Date(),
            'totalHours':totalHours,
            'type':'approval'
        };
        revision.unshift(historyEntry);

        Meteor.call("updateRevision", id, revision);

        Session.set('current_page', 'approval_page');
    },
    'click .reject': function (e, t) {
        var startDateStr = Session.get("startDate");
        var date = (new Date(startDateStr)).toLocaleDateString();

        var data = Session.get('editing-user-page');
        if (!data){
            return;
        }

        var userId = Meteor.users.findOne({username: data.username})._id;

        var projectId = data.project;
        var projectName = ChargeNumbers.findOne({'_id' : projectId}).name;

        var rejectComment = $('#rejectComment').val();

        var sheet = TimeSheet.findOne({'startDate':date,'userId':userId,'submitted':true});
        var totalHours = ActiveDBService.getTotalHoursForProject(sheet, projectId);

        var managerName = Meteor.users.findOne({'_id':Session.get('LdapId')}).username;

        var revision = sheet.revision;

        Meteor.call('updateApprovalStatusInTimeSheet', date, userId, projectId, false, rejectComment);

        historyEntry = {
            'manager':managerName,
            'project':projectName,
            'timestamp':new Date(),
            'totalHours':totalHours,
            'type':'rejection',
            'comment':rejectComment
        };
        revision.unshift(historyEntry);
        Meteor.call('updateRevision', sheet._id, revision, function (){
            $('.toast').addClass('active');
            setTimeout(function () {
                $('.toast').removeClass('active');
            }, 5000);
        });

        Session.set('current_page', 'approval_page');
    }
};

Template.projectComments.events = {
    'blur .projectCommentsRow': function (event) {
        /*
         Handles onBlur effects and saving data to the timesheet.
         */
        var row = event.currentTarget;
        var issues = $(row).find('#Issues')[0].value;
        var next = $(row).find('#Next')[0].value;
        var projectId = $(row).find('#project_comments_name')[0].parentNode.id;
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }

        Meteor.call('updateProjectCommentsTimeSheet', Session.get("startDate"), user, projectId, issues, next, Session.get('editing-user-page'),
            function (){
                $('.toast').addClass('active');
                setTimeout(function () {
                    $('.toast').removeClass('active');
                }, 5000);
        });
    }
};

Template.projectHours.helpers({
    day_date : function(dayIndex){
        return day_date(dayIndex);
    }
});

Template.projectHoursFilled.events = {
    'blur .filledRow': function (event) {
        /*
         Handles onBlur effects and saving data to the timesheet.
         */

        var row = event.currentTarget.parentNode;
        var comment_t = $(row).find('#Comment')[0].value;
        var sunday_t = parseFloat($(row).find('#Sunday')[0].value) || 0;
        var monday_t = parseFloat($(row).find('#Monday')[0].value) || 0;
        var tuesday_t = parseFloat($(row).find('#Tuesday')[0].value) || 0;
        var wednesday_t = parseFloat($(row).find('#Wednesday')[0].value) || 0;
        var thursday_t = parseFloat($(row).find('#Thursday')[0].value) || 0;
        var friday_t = parseFloat($(row).find('#Friday')[0].value) || 0;
        var saturday_t = parseFloat($(row).find('#Saturday')[0].value) || 0;
        var rowID = $(row).attr('id');
        var projectIndex = $(row).find('#project_select')[0].selectedIndex;
        var projectId = $(row).find('#project_select')[0].children[projectIndex].id;

        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }

        TimeSheetService.removeErrorClasses(row, ['#Comment', '#Sunday', '#Monday', '#Tuesday', '#Wednesday', '#Thursday', '#Friday', '#Saturday', '#projectName']);

        if (TimeSheetService.ensureValidEntry(row, comment_t, sunday_t, monday_t, tuesday_t, wednesday_t, thursday_t, friday_t, saturday_t, projectId)) {
            
            ActiveDBService.updateRowInTimeSheet(Session.get("startDate"), user, projectId,
                comment_t,
                sunday_t,
                monday_t,
                tuesday_t,
                wednesday_t,
                thursday_t,
                friday_t,
                saturday_t,
                rowID,
                function (){
                    $('.toast').addClass('active');
                    setTimeout(function () {
                        $('.toast').removeClass('active');
                    }, 5000);
                }
            );
        }
        //Session.set("rows_have_been_update", projectID);

    }
    ,
    'click button': function (event) {
        /*
         Handle when the user hits the delete button for a row
         */
        var row = event.currentTarget.parentNode.parentNode;
        var projectId = $(row).find('#project_select')[0].parentNode.id;

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
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

        if (!sheet['submitted'] || TimeSheetService.checkSentBack()) {
            Meteor.call('removeRowInTimeSheet', Session.get("startDate"), user, rowID, projectId,function (){
                $('.toast').addClass('active');
                setTimeout(function () {
                    $('.toast').removeClass('active');
                }, 5000);
            });
            //Hack to make the next row not inherit it's previous's properties
            //Otherwise, the UI can unlock for a row that is pending/approved.
            //We haven't found a great solution to fix this, but this works fine and is not noticable to the user.
            Session.set('current_page', 'time_sheet');
            Meteor.flush();
            Session.set('current_page', 'selected_timesheet');
            Meteor.flush();
        }
    }
}

Template.projectHoursFilled.helpers({
    'name' : function(projectId){
      /*
        Returns the name of a project given its projectID
      */
      var name = ChargeNumbers.findOne({'_id' : projectId});
      return name['name'];
    },
    day_date : function(dayIndex){
        return day_date(dayIndex);
    }
});

Template.projectHours.events = {
    'click button': function (event) {
        /*
         Check for errors first, then add the row to the timesheet if there are none.
         */
        var row = event.currentTarget.parentNode.parentNode;
        var comment_t = $(row).find('#Comment')[0].value;
        var sunday_t = parseFloat($(row).find('#Sunday')[0].value, 10) || 0;
        var monday_t = parseFloat($(row).find('#Monday')[0].value, 10) || 0;
        var tuesday_t = parseFloat($(row).find('#Tuesday')[0].value, 10) || 0;
        var wednesday_t = parseFloat($(row).find('#Wednesday')[0].value, 10) || 0;
        var thursday_t = parseFloat($(row).find('#Thursday')[0].value, 10) || 0;
        var friday_t = parseFloat($(row).find('#Friday')[0].value, 10) || 0;
        var saturday_t = parseFloat($(row).find('#Saturday')[0].value, 10) || 0;

        // I added this so we can retrieve the selected project's ID so we can add it to the Database
        var projectIndex = $(row).find('#project_select')[0].selectedIndex;
        var projectId = $(row).find('#project_select')[0].children[projectIndex].id;

        Session.get("max_Row");
        var rowID = Session.get("max_Row") + 1;
        Session.set("max_Row", rowID);
        $(row).attr('id', rowID);


        TimeSheetService.removeErrorClasses(row, ['#Comment', '#Sunday', '#Monday', '#Tuesday', '#Wednesday', '#Thursday', '#Friday', '#Saturday']);

        if (TimeSheetService.ensureValidEntry(row, comment_t, sunday_t, monday_t, tuesday_t, wednesday_t, thursday_t, friday_t, saturday_t)) {

            /*
             Database Entry
             Adding entry to the Database correctly. -Dan

             */
            var date = Session.get("startDate");
            var user = Session.get('LdapId');
            var data = Session.get('editing-user-page');
            if (data){
                var userO = Meteor.users.findOne({username : data.username});
                if (userO){
                    user = userO._id;
                }
            }
            var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

            var data = Session.get('editing-user-page');

            if (!sheet['submitted'] || TimeSheetService.checkSentBack() || data) {
                Meteor.call('addRowToTimeSheet',Session.get("startDate"), user, projectId,
                    comment_t,
                    sunday_t,
                    monday_t,
                    tuesday_t,
                    wednesday_t,
                    thursday_t,
                    friday_t,
                    saturday_t,
                    rowID,function (){
                        $('.toast').addClass('active');
                        setTimeout(function () {
                            $('.toast').removeClass('active');
                        }, 5000);
                    });
                comment_t = '';
                sunday_t = '';
                monday_t = '';
                tuesday_t = '';
                wednesday_t = '';
                thursday_t = '';
                friday_t = '';
                saturday_t = '';

            }
        }

        $(row).find('#Comment')[0].value = comment_t;
        $(row).find('#Sunday')[0].value = sunday_t == 0 ? '' : sunday_t;
        $(row).find('#Monday')[0].value = monday_t == 0 ? '' : monday_t;
        $(row).find('#Tuesday')[0].value = tuesday_t == 0 ? '' : tuesday_t;
        $(row).find('#Wednesday')[0].value = wednesday_t == 0 ? '' : wednesday_t;
        $(row).find('#Thursday')[0].value = thursday_t == 0 ? '' : thursday_t;
        $(row).find('#Friday')[0].value = friday_t == 0 ? '' : friday_t;
        $(row).find('#Saturday')[0].value = saturday_t == 0 ? '' : saturday_t;
    }
};

TimeSheetService = {
    removeErrorClasses: function (row, selectors) {
    /*
     Remove error pop-ups from the timesheet UI
     */
        for (var i = 0; i < selectors.length; i++) {
            var item = $(row).find(selectors[i]);
            item.parent().removeClass('has-error');
            item.tooltip('destroy');
        }
    },
    checkSentBack: function () {
        /*
         Check if any project on the timesheet has been rejected
         */
        var date = Session.get("startDate");
        var user = Session.get('LdapId');
        var data = Session.get('editing-user-page');
        if (data){
            var userO = Meteor.users.findOne({username : data.username});
            if (userO){
                user = userO._id;
            }
        }
        var sheet = TimeSheet.findOne({'startDate': date, 'userId': user});

        var projectEntries = sheet['projectEntriesArray'];

        var sentBack = false;
        // for (i = 0; i < projectEntries.length; i++) {
        //     if (projectEntries[i]['SentBack']) {
        //         sentBack = true;
        //     }
        // }
        for (var i in sheet.projectApprovalArray){
            if(sheet.projectApprovalArray[i].sentBack){
                sentBack = true;
            }
        }
        return sentBack || sheet.globalSentBack;
    },
    addError: function (row, selector, message) {
        /*
         Helper method to easily add an error message to a field.
         */
        $(row).find(selector).parent().addClass('has-error');
        $(row).find(selector).tooltip({
            title: message,
            trigger: 'hover',
            animation: false
        });
        $(row).find(selector).tooltip('show');
    },

    ensureValidEntry: function (row, comment_t, sunday_t, monday_t, tuesday_t, wednesday_t, thursday_t, friday_t, saturday_t, projectId) {
        /*
         Error handling for timesheet fields
         */
        var out_of_bounds_message = "Field must be a multiple of .25 and cannot exceed 24 hours in a day across all projects";

        console.log(sunday_t);
        var valid = true;
        if (comment_t === '') {
            TimeSheetService.addError(row, '#Comment', "Description is Required");
            valid = false;
        }

        if (projectId === '') {
            TimeSheetService.addError(row, '#projectName', "Field Cannot be Empty");
            valid = false;
        }
        if ((isNaN(sunday_t) && sunday_t != '') || sunday_t <0) {
            TimeSheetService.addError(row, '#Sunday', "Field is Not a Positive Number");
            valid = false;
        }
        if ((sunday_t % .25 != 0) ||  ActiveDBService.getDayTotal(0)+ sunday_t > 24) {
            TimeSheetService.addError(row, '#Sunday', out_of_bounds_message);
            valid = false;
        }
        if ((isNaN(monday_t) && monday_t != '') || monday_t <0) {
            TimeSheetService.addError(row, '#Monday', "Field is Not a Positive Number");
            valid = false;
        }
        if ((monday_t % .25 != 0) || (ActiveDBService.getDayTotal(1)+ monday_t > 24)) {
            TimeSheetService.addError(row, '#Monday', out_of_bounds_message);
            valid = false;
        }
        if ((isNaN(tuesday_t) && tuesday_t != '') || tuesday_t <0) {
            TimeSheetService.addError(row, '#Tuesday', "Field is Not a Positive Number");
            valid = false;
        }
        if ((tuesday_t % .25 != 0) || (ActiveDBService.getDayTotal(2)+ tuesday_t > 24) || (tuesday_t <0)) {
            TimeSheetService.addError(row, '#Tuesday', out_of_bounds_message);
            valid = false;
        }
        if ((isNaN(wednesday_t) && wednesday_t != '') || wednesday_t <0) {
            TimeSheetService.addError(row, '#Wednesday', "Field is Not a Positive Number");
            valid = false;
        }
        if ((wednesday_t % .25 != 0) || (ActiveDBService.getDayTotal(3)+ wednesday_t > 24)) {
            TimeSheetService.addError(row, '#Wednesday', out_of_bounds_message);
            valid = false;
        }
        if ((isNaN(thursday_t) && thursday_t != '') || thursday_t <0) {
            TimeSheetService.addError(row, '#Thursday', "Field is Not a Positive Number");
            valid = false;
        }
        if ((thursday_t % .25 != 0) || (ActiveDBService.getDayTotal(4)+ thursday_t > 24)) {
            TimeSheetService.addError(row, '#Thursday', out_of_bounds_message);
            valid = false;
        }
        if ((isNaN(friday_t) && friday_t != '') || friday_t <0) {
            TimeSheetService.addError(row, '#Friday', "Field is Not a Positive Number");
            valid = false;
        }
        if ((friday_t % .25 != 0) || (ActiveDBService.getDayTotal(5)+ friday_t > 24)) {
            TimeSheetService.addError(row, '#Friday', out_of_bounds_message);
            valid = false;
        }
        if ((isNaN(saturday_t) && saturday_t != '') || saturday_t <0) {
            TimeSheetService.addError(row, '#Saturday', "Field is Not a Positive Number");
            valid = false;
        }
        if ((saturday_t % .25 != 0) || (ActiveDBService.getDayTotal(6)+ saturday_t > 24)) {
            TimeSheetService.addError(row, '#Saturday', out_of_bounds_message);
            valid = false;
        }
        if (((sunday_t === '') || (sunday_t === 0)) &&
            ((monday_t === '') || (monday_t === 0)) &&
            ((tuesday_t === '') || (tuesday_t === 0)) &&
            ((wednesday_t === '') || (wednesday_t === 0)) &&
            ((thursday_t === '') || (thursday_t === 0)) &&
            ((friday_t === '') || (friday_t === 0)) &&
            ((saturday_t === '') || (saturday_t === 0))) {
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
