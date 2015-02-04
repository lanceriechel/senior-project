/**
 * Created by sternetj on 12/7/14.
 */
Session.set('current_project_to_approve', 'none');
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Next Week Goals", "Issues", "Concerns", "General Comment"];

function getStartDate() {
    var d = new Date();
    d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 8);
    return d;
}

function getCurrentDate() {
    var d = new Date();
    d.setDate((d.getDate() - (d.getDay() + 6) % 7) - 1);
    return d;
}

//Methods for the rows that show which users need their timesheets approved
Template.toApprove_Template.helpers({
    toApprove: function () {
        var selected = Session.get('current_project_to_approve');
        var totals = {};
        var hasSubmitted = {};

        var isActive = 1;
        var startDateStr = Session.get("startDate");
        var startDate = new Date(startDateStr);
        var timesheets = TimeSheet.find({
            'active': isActive,
            'startDate': startDate.toLocaleDateString()
        });

        var toReturn = [];

        timesheets.forEach(function (t) {
            t.projectEntriesArray.forEach(function (pe) {
                var total = 0;
                if (pe.projectID == selected && !pe.Approved) {
                    pe.EntryArray.forEach(function (a) {
                        for (var b in a.hours) {
                            total += parseInt(a.hours[b]);
                        }
                    });
                }
                if (Meteor.users.findOne({_id: t.userId, projects: {$in : [selected]}})){
                    if (totals[t.userId] == null) {
                        totals[t.userId] = {
                            total: 0,
                            sentBack: false,
                            approved: false
                        };
                    }
                    totals[t.userId] =
                    {
                        total: totals[t.userId].total + total,
                        sentBack: totals[t.userId].sentBack || (pe.SentBack && pe.projectID == selected) || !t.submitted,
                        approved: totals[t.userId].approved || (pe.Approved && pe.projectID == selected)
                    };
                }
            });
            hasSubmitted[t.userId] = t.submitted;
            if (totals[t.userId] == null) {
                if (Meteor.users.findOne({_id: t.userId, projects: {$in : [selected]}})){
                    totals[t.userId] = {
                        total: 0,
                        sentBack: !t.submitted,
                        approved: false
                    };
                }
            }
        });

        console.log(totals);

        for (var key in totals) {
            if (totals.hasOwnProperty(key) && !totals[key].approved) {
                var u = Meteor.users.findOne({_id: key});
                toReturn.push({
                    selected: '',
                    submitted: hasSubmitted[key],
                    sentBack:  totals[key].sentBack,
                    username: u.username,
                    total: totals[key].total
                });
            }
        }

        var compare = function (a,b) {
            if (a.submitted > b.submitted) {
                return -1;
            }else if (a.submitted == b.submitted){
                if (a.sentBack > b.sentBack){
                    return 1;
                }else if (a.sentBack < b.sentBack){
                    return -1;
                }else {
                    return 0;
                }
            }

            return 1;
        };

        toReturn = toReturn.sort(compare);

        if (toReturn[0]){
            toReturn[0].selected = 'selected';
            Session.set('current_user_to_approve', toReturn[0].username);
        }

        return toReturn;
    }
});

Template.toApprove_Template.events({
    'click .approve': function (e) {
        if (!e.target.parentNode.parentNode.classList.contains('selected')) return;

        var startDateStr = Session.get("startDate");
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
        if (!e.target.parentNode.parentNode.classList.contains("selected")) return;

        console.log('rejecting');

        var startDateStr = Session.get("startDate");
        var date = (new Date(startDateStr)).toLocaleDateString();

        var userId = Meteor.users.findOne({username: Session.get('current_user_to_approve')})._id;

        var projectId = Session.get('current_project_to_approve');
        var projectName = ChargeNumbers.findOne({'id' : projectId}).name;

        var rejectComment = $(e.target.parentNode.parentNode).find('#rejectComment')[0].value;
        $(e.target.parentNode.parentNode).find('#rejectComment')[0].value = '';

        var sheet = TimeSheet.findOne({'startDate':date,'userId':userId,'submitted':true});
        var totalHours = ActiveDBService.getTotalHoursForProject(sheet, projectId);

        var managerName = Meteor.users.findOne({'_id':Session.get('LdapId')}).username;

        var revision = sheet.revision;

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
                }
            });
    }
});

Template.approval_Template.helpers({
    needsApproving: function () {
        var selected = Session.get('current_project_to_approve');

        var isActive = 1;
        var startDate = new Date(Session.get("startDate"));
        var timesheets = TimeSheet.find({
            'active': isActive,
            'startDate': startDate.toLocaleDateString()
        });

        var needsApproving = false;
        timesheets.forEach(function (t) {
            var nAprroving = false;
            t.projectEntriesArray.forEach(function (pe) {
                if (pe.projectID === selected) {
                    nAprroving == true;
                }
            });
            if (!nAprroving) {
                if (Meteor.users.findOne({_id: t.userId, projects: {$in : [selected]}})){
                    nAprroving =  true;
                }
            }
            needsApproving = needsApproving || nAprroving;
        });

        return needsApproving;
    },
    'managedProjects': function () {
        "use strict";
        var person = Meteor.users.findOne({'_id': Session.get('LdapId')});
        if (person == null || (!person.manager && !person.admin)) return;
        var toReturn = [];

        var id;
        if (person.admin){
            id = ChargeNumbers.findOne({}).id;
            Session.set('current_project_to_approve', id);
            ChargeNumbers.find({}).forEach(function (cn){
                if (cn.indirect) {
                    toReturn.push({
                        charge_number: cn.id,
                        text: 'Indirect   ( ' + cn.name + ' )'
                    });
                } else {
                    toReturn.push({
                        charge_number: cn.id,
                        text: cn.id + '   ( ' + cn.name + ' )'
                    });
                }
            });
        }else{
            id = ChargeNumbers.findOne({'manager': person.username}).id;
            ChargeNumbers.find({'manager': person.username}).forEach(function (cn){
                if (cn.indirect) {
                    toReturn.push({
                        charge_number: cn.id,
                        text: 'Indirect   ( ' + cn.name + ' )'
                    });
                } else {
                    toReturn.push({
                        charge_number: cn.id,
                        text: cn.id + '   ( ' + cn.name + ' )'
                    });
                }
            });
        }

        Session.set('current_project_to_approve', id);

        return toReturn;
    },
    isActive: function (date) {
        "use strict";
        return ProjectService.isActive(date);
    },
    userTimesheet: function () {
        var chargeNumber = Session.get('current_project_to_approve');
        var username = Session.get('current_user_to_approve');
        if (!username) return;
        var userId = Meteor.users.findOne({username: username})._id;

        var isActive = 1;
        var startDateStr = Session.get("startDate");
        var startDate = new Date(startDateStr);
        var timesheets = TimeSheet.find({
            'active': isActive,
            'userId': userId,
            'startDate': startDate.toLocaleDateString()
        });

        var toReturn = [];

        timesheets.forEach(function (t) {
            t.projectEntriesArray.forEach(function (pe) {
                if (pe.projectID === chargeNumber && !pe.Approved) {
                    pe.EntryArray.forEach(function (a) {
                        for (var b in a.hours) {
                            if (toReturn[b] == null) {
                                toReturn[b] = {
                                    day: days[b],
                                    hours: parseInt(a.hours[b]),
                                    comment: [{com: a.hours[b] > 0 ? a.Comment : ""}]
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
                        day: "Next Week Goals",
                        hours: "",
                        comment: [{com: pe.next}]
                    }
                    toReturn[8] = {
                        day: "Issues",
                        hours: "",
                        comment: [{com: pe.issues}]
                    };
                    toReturn[9] = {
                        day: "Concerns",
                        hours: "",
                        comment: [{com: t.concerns}]
                    };
                    toReturn[10] = {
                        day: "General Comment",
                        hours: "",
                        comment: [{com: t.generalComment}]
                    };
                }
            });
            if (toReturn.length === 0){
                for(var i = 0; i < 11; i++){
                    toReturn[i] = {
                        day: days[i],
                        hours: (i > 6 ? '' : 0),
                        comment: ''
                    };
                }
            }
        });

        return toReturn;
    }
});

Template.approval_Template.events({
    'onload #timesheet_approvals': function (e) {
        lastSelection = document.getElementById("timesheet_approvals");
    },
    'change [type=current-project-checkbox]': function (e, t) {
        "use strict";
        var str = e.target.options[e.target.selectedIndex].value;
        Session.set('current_project_to_approve', str);
        Session.set('current_user_to_approve', null);
        var lastSelection = document.getElementsByClassName("selected toApprove-Rows")[0];
        if (lastSelection){
            lastSelection.classList.remove("selected");
        }
        lastSelection = document.getElementsByClassName("toApprove-Rows")[0];
        if (lastSelection){
            lastSelection.classList.add("selected");
        }
    },
    'click .row-item': function (e, t) {
        lastSelection = document.getElementsByClassName("selected toApprove-Rows")[0];
        if (lastSelection){
            lastSelection.classList.remove("selected");
        }

        var lastSelection = e.target;
        while (lastSelection != null && !lastSelection.classList.contains("row-item")) {
            lastSelection = lastSelection.parentNode;
        }
        lastSelection.classList.add("selected");

        if (lastSelection.childNodes[2].id === 'username'){
            Session.set('current_user_to_approve', lastSelection.childNodes[2].firstChild.textContent);
        }else{
            Session.set('current_user_to_approve', lastSelection.childNodes[2].childNodes[1].childNodes[3].childNodes[1].textContent);
        }
    },
    'click .edit-sheet': function() {
        var username = Session.get('current_user_to_approve');
        if (!username) return;

        var data = {
            'username': username,
            'project' : Session.get('current_project_to_approve')
        }


        Session.set('current_page', 'selected_timesheet');
        var d = new Date(Session.get("startDate"));
        Session.set('startDate', d.toLocaleDateString());
        Session.set('editing-user-page', data);
    }
});

Template.date_picker.helpers({
    currentDateRange: function () {
        var startDate = Session.get("startDate");
        if (startDate == null) {
            startDate = getStartDate();
        }

        var startDate2 = new Date(startDate);

        var d2 = new Date(startDate);
        d2.setDate(d2.getDate() + 6);
        var endDate = d2.toLocaleDateString();

        var d2 = new Date(startDate);
        Session.set("startDate", startDate2.toISOString());
        var startDateStr = startDate2.toLocaleDateString();

        return startDateStr + " - " + endDate;
    }
});

Template.date_picker.events({
    'click .prevWeek': function () {
        var startDate = Session.get("startDate");

        var d2 = new Date(startDate);
        d2.setDate(d2.getDate() - 7);

        Session.set("startDate", d2.toISOString());
    },
    'click .nextWeek': function () {
        var startDate = Session.get("startDate");

        var d2 = new Date(startDate);
        d2.setDate(d2.getDate() + 7);

        //don't advance past current week
        if (d2 > getCurrentDate()) {
            return;
        }

        Session.set("startDate", d2.toISOString());
    }
})