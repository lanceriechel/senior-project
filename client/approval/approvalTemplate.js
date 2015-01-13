/**
 * Created by sternetj on 12/7/14.
 */
Session.set('current_project_to_approve', 'none');
var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getStartDate() {
    var d = new Date();
    d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
    return d;
}

//Methods for the rows that show which users need their timesheets approved
Template.toApprove_Template.helpers({
    /*
        Populates list of timesheets for the approval page
    */
    toApprove: function () {
        var selected = Session.get('current_project_to_approve');
        var totals = {};
        var isSubmitted = true;
        var isActive = 1;
        var startDateStr = Session.get('startDate');
        var startDate = new Date(startDateStr);
        var timesheets = TimeSheet.find({
            'submitted': isSubmitted,
            'active': isActive,
            'startDate': startDate.toLocaleDateString()
        });

        var toReturn = [];

        timesheets.forEach(function (t) {
            t.projectEntriesArray.forEach(function (pe) {
                if (pe.projectID == selected && !pe.Approved && !pe.SentBack) {
                    var total = 0;
                    pe.EntryArray.forEach(function (a) {
                            for (var b in a.hours) {
                                total += parseInt(a.hours[b]);
                            }
                    });
                    if (totals[t.userId] == null) {
                        totals[t.userId] = 0;
                    }
                    totals[t.userId] = totals[t.userId] + total;
                }
            });
        });

        var shouldSelect = 'selected';
        var i = 0;
        for (var key in totals) {
            if (totals.hasOwnProperty(key)) {
                var u = Meteor.users.findOne({_id: key});
                toReturn[i] = {
                    selected: shouldSelect,
                    username: u.username,
                    total: totals[key]
                };
                i = i + 1;
            }
            if (shouldSelect !== '') {
                Session.set('current_user_to_approve', u.username);
            }
            shouldSelect = '';
        }


        return toReturn;
    }
});

Template.toApprove_Template.events({
    'click .approve': function (e) {
        /*
            Approves the project entry for the timesheet and locks it.
        */
        if (!e.target.parentNode.parentNode.classList.contains('selected')){
            return;
        }
        var startDateStr = Session.get('startDate');
        var date = (new Date(startDateStr)).toLocaleDateString();
        var userId = Meteor.users.findOne({username: Session.get('current_user_to_approve')})._id;
        var projectId = Session.get('current_project_to_approve');
        var projectName = ChargeNumbers.findOne({'id' : projectId}).name;
        var sheet = TimeSheet.findOne({'startDate':date,'userId':userId,'submitted':true});
        var totalHours = ActiveDBService.getTotalHoursForProject(sheet, projectId);
        var managerName = Meteor.users.findOne({'_id':Session.get('LdapId')}).username;
        var revision = sheet.revision;

        ActiveDBService.updateApprovalStatusInTimeSheet(date, userId, projectId, true, 'Approved');
        ActiveDBService.updateActiveStatusInTimesheet(date, userId, projectId);

        historyEntry = {
            'manager':managerName,
            'project':projectName,
            'timestamp':new Date(),
            'totalHours':totalHours,
            'type':'approval'
        };
        revision.unshift(historyEntry);

        TimeSheet.update({'_id':sheet._id},
        {
            $set:{
                'revision': revision
            },
        });
    },
    'click .reject': function (e, t) {
        /*
            Rejects a project entry for the timesheet and send it back to the employee with comments
        */
        if (!e.target.parentNode.parentNode.classList.contains('selected')) return;

        var startDateStr = Session.get('startDate');
        var date = (new Date(startDateStr)).toLocaleDateString();
        var userId = Meteor.users.findOne({username: Session.get('current_user_to_approve')})._id;
        var projectId = Session.get('current_project_to_approve');
        var projectName = ChargeNumbers.findOne({'id' : projectId}).name;
        var rejectComment = $(e.target.parentNode.parentNode).find('#rejectComment')[0].value;
        var sheet = TimeSheet.findOne({'startDate':date,'userId':userId,'submitted':true});
        var totalHours = ActiveDBService.getTotalHoursForProject(sheet, projectId);
        var managerName = Meteor.users.findOne({'_id':Session.get('LdapId')}).username;
        var revision = sheet.revision

        ActiveDBService.updateApprovalStatusInTimeSheet(date, userId, projectId, false, rejectComment);

        historyEntry = {
            'manager':managerName,
            'project':projectName,
            'timestamp':new Date(),
            'totalHours':totalHours,
            'type':'rejection',
            'comment':rejectComment
        };
        revision.unshift(historyEntry);

        TimeSheet.update({'_id':sheet._id},
        {
            $set:{
                'revision': revision
            },
        });
    }
})

Template.approval_Template.helpers({
    'managedProjects': function () {
        'use strict';
        var person = Meteor.users.findOne({'_id': Session.get('LdapId')});
        if (person == null || !person.manager) return;

        //Get first one to set selected row
        var id = ChargeNumbers.findOne({'manager': person.username}).id;
        Session.set('current_project_to_approve', id);

        return ChargeNumbers.find({'manager': person.username});
    },
    isActive: function (date) {
        'use strict';
        return ProjectService.isActive(date);
    },
    userTimesheet: function () {
        /*
            Returns timesheets in a different format for the approval page
        */
        var username = Session.get('current_user_to_approve');
        if (!username) return;
        var userId = Meteor.users.findOne({username: username})._id;
        var chargeNumber = Session.get('current_project_to_approve');
        var isSubmitted = true;
        var isActive = 1;
        var startDateStr = Session.get('startDate');
        var startDate = new Date(startDateStr);
        var timesheets = TimeSheet.find({
            'submitted': isSubmitted,
            'active': isActive,
            'userId': userId,
            'startDate': startDate.toLocaleDateString()
        });

        var toReturn = [];

        timesheets.forEach(function (t) {
            t.projectEntriesArray.forEach(function (pe) {
                if (pe.projectID == chargeNumber && !pe.Approved) {
                    pe.EntryArray.forEach(function (a) {
                        for (var b in a.hours) {
                            if (toReturn[b] == null) {
                                toReturn[b] = {
                                    day: days[b],
                                    hours: parseInt(a.hours[b]),
                                    comment: [{com: a.hours[b] > 0 ? a.Comment : ''}]
                                }
                                continue;
                            }
                            if (a.hours[b] > 0) {
                                toReturn[b].comment.push({com: a.Comment});
                                toReturn[b] = {
                                    day: toReturn[b].day,
                                    hours: toReturn[b].hours + parseInt(a.hours[b]),
                                    comment: toReturn[b].comment
                                };
                            }
                        }
                    });
                    toReturn[7] = {
                        day: 'Next Week Goals',
                        hours: '',
                        comment: [{com: pe.next}]
                    };
                    toReturn[8] = {
                        day: 'Issues',
                        hours: '',
                        comment: [{com: pe.issues}]
                    };
                    toReturn[9] = {
                        day: 'Concerns',
                        hours: '',
                        comment: [{com: t.concerns}]
                    };
                    toReturn[10] = {
                        day: 'General Comment',
                        hours: '',
                        comment: [{com: t.generalComment}]
                    };
                }
            });
        });

        return toReturn;
    }
});

Template.approval_Template.events({
    'onload #timesheet_approvals': function (e) {
        /*
            Debugging output
        */
        lastSelection = document.getElementById('timesheet_approvals');
        console.log(lastSelection);
    },
    'change [type=current-project-checkbox]': function (e, t) {
        'use strict';
        /*
            Sets a session variable so the code knows which project is being approved
        */
        var str = e.target.options[e.target.selectedIndex].text;
        Session.set('current_project_to_approve', str);
        Session.set('current_user_to_approve', null);
    },
    'click .row-item': function (e, t) {
        /*
            Sets a session variable so the code knows which user is being approved
        */
        lastSelection = document.getElementsByClassName('selected toApprove-Rows')[0];
        lastSelection.classList.remove('selected');


        var lastSelection = e.target;
        while (lastSelection != null && !lastSelection.classList.contains('row-item')) {
            lastSelection = lastSelection.parentNode;
        }
        lastSelection.classList.add('selected');

        Session.set('current_user_to_approve', lastSelection.childNodes[1].firstChild.textContent);
    }
});

Template.date_picker.helpers({
    currentDateRange: function () {
        /*
            Get a string that shows the date for last Sunday - this Saturday
        */
        var startDate = Session.get('startDate');
        if (startDate == null) {
            startDate = getStartDate();
        }

        var startDate2 = new Date(startDate);

        var d2 = new Date(startDate);
        d2.setDate(d2.getDate() + 6);
        var endDate = d2.toLocaleDateString();

        Session.set('startDate', startDate2.toISOString());
        var startDateStr = startDate2.toLocaleDateString();

        return startDateStr + ' - ' + endDate;
    }
});

Template.date_picker.events({
    'click .prevWeek': function () {
        /*
            Set a startdate session variable for the previous week
        */
        var startDate = Session.get('startDate');

        var d2 = new Date(startDate);
        d2.setDate(d2.getDate() - 7);

        Session.set('startDate', d2.toISOString());
    },
    'click .nextWeek': function () {
        /*
            Set a startdate session variable for next week
        */
        var startDate = Session.get('startDate');

        var d2 = new Date(startDate);
        d2.setDate(d2.getDate() + 7);

        //don't advance past current week
        if (d2 > getStartDate()) {
            return;
        }

        Session.set('startDate', d2.toISOString());
    }
})
