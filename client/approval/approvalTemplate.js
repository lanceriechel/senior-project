/**
 * Created by sternetj on 12/7/14.
 */
Session.set('current_project_to_approve', 'none');

Template.approval_Template.helpers({
    'managedProjects': function () {
        "use strict";
        var person = Meteor.users.findOne({_id: Meteor.userId()});
        if (person == null) return;
        var id = ChargeNumbers.findOne({manager: person.username}).id;
        Session.set('current_project_to_approve', id);
        return ChargeNumbers.find({manager: person.username});

    },
    isActive: function (date) {
        "use strict";
        return ProjectService.isActive(date);
    },
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
                        for (var b in a.hours){
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

        var i = 0;
        for (var key in totals) {
            if (totals.hasOwnProperty(key)) {
                var u = Meteor.users.findOne({_id: key});
                toReturn[i] = {
                    username: u.username,
                    total: totals[key]
                };
                i = i + 1;
            }
        }


        return toReturn;
    }
});

Template.approval_Template.events({
    'change [type=current-project-checkbox]': function (e, t) {
        "use strict";
        var str = e.target.options[e.target.selectedIndex].text;
        Session.set('current_project_to_approve', str);
    }
});