/**
 * Created by sternetj on 12/7/14.
 */
Session.set('current_project_to_approve', 'none');
var lastSelection = null;
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var hit = false;

Template.toApprove_Template.helpers({
    toApprove: function () {
        var selected = Session.get('current_project_to_approve');
        var totals = {};

        var isSubmitted = true;
        var isActive = 1;
        var timesheets = TimeSheet.find({'submitted': isSubmitted, 'active': isActive});

        var toReturn = [];

        timesheets.forEach(function (t) {
            t.projectEntriesArray.forEach(function (pe) {
                if (pe.projectID == selected) {
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

        var shouldSelect = "selected";
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
            if (shouldSelect != ""){
                Session.set('current_user_to_approve',u.username);
            }
            shouldSelect="";
        }


        return toReturn;
    }
});

Template.approval_Template.helpers({
    'managedProjects': function () {
        "use strict";
        var person = Meteor.users.findOne({_id: Meteor.userId()});
        if (person == null) return;
        var id = ChargeNumbers.findOne({manager: person.username}).id;
        Session.set('current_project_to_approve', id);
        hit = true;
        return ChargeNumbers.find({manager: person.username});
    },
    isActive: function (date) {
        "use strict";
        return ProjectService.isActive(date);
    },
    userTimesheet: function () {
        var username = Session.get('current_user_to_approve');
        if (!username) return;
        var userId = Meteor.users.findOne({username: username})._id;
        var chargeNumber = Session.get('current_project_to_approve');

        var isSubmitted = true;
        var isActive = 1;
        var timesheets = TimeSheet.find({'submitted': isSubmitted, 'active': isActive, 'userId': userId});

        var toReturn = [];

        timesheets.forEach(function (t) {
            t.projectEntriesArray.forEach(function (pe) {
                if (pe.projectID == chargeNumber) {
                    pe.EntryArray.forEach(function (a) {
                        for (var b in a.hours) {
                            if (toReturn[b] == null) {
                                for (var i = 0; i < 8; i++) {
                                    toReturn[i] = {
                                        day: days[i],
                                        hours: 0,
                                        comment: ""
                                    }
                                }

                            }
                            if (a.hours[b] > 0) {
                                toReturn[b] = {
                                    day: toReturn[b].day,
                                    hours: toReturn[b].hours + parseInt(a.hours[b]),
                                    comment: toReturn[b].comment + a.Comment
                                }
                            }
                        }
                    });
                }
                toReturn[7] = {
                    day: "Weekly Description",
                    hours: "",
                    comment: t.generalComment
                }
            });
        });

        return toReturn;
    }
});

Template.approval_Template.events({
    'onload #timesheet_approvals':function (e){
        lastSelection = document.getElementById("timesheet_approvals");
        console.log(lastSelection);
    },
    'change [type=current-project-checkbox]': function (e, t) {
        "use strict";
        var str = e.target.options[e.target.selectedIndex].text;
        Session.set('current_project_to_approve', str);
        Session.set('current_user_to_approve', null);
    },
    'click .row-item': function (e, t) {
        if (lastSelection != null) {
            lastSelection.classList.remove("selected");
        }
        lastSelection = e.target;
        while (lastSelection != null && !lastSelection.classList.contains("row-item")) {
            lastSelection = lastSelection.parentNode;
        }
        lastSelection.classList.add("selected");

        Session.set('current_user_to_approve', lastSelection.childNodes[1].firstChild.textContent);
    }
});