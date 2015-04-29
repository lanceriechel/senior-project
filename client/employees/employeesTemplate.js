Template.associatedProjects.helpers({
    addingTag: function () {
        'use strict';
        return Session.equals('editing_addtag', this._id);
    },
    doneClass: function () {
        'use strict';
        return this.done ? 'done' : '';
    },
    getName: function (id) {
        'use strict';
        var proj = ChargeNumbers.findOne({'_id':id});
        return proj.name;
    }
});

Template.employees_Template.events({
    'click .full': function () {
        'use strict';
        Meteor.call('setEmployeeFullTime', this._id, true);
    },
    'click .part': function () {
        Meteor.call('setEmployeeFullTime', this._id, false);
    }
});

Template.associatedProjects.events({
    'click .addtag': function (evt, tmpl) {
        'use strict';
        //alert(this.username + " ");
        // Session.set('editing_addtag', this._id);
        // Deps.flush(); // update DOM before focus
        // activateInput(tmpl.find("#edittag-input"));
        var id = $('#edittag-input').find(":selected").attr('value');
        var userId = this._id

        Meteor.call('addEmployeeToProject', userId, id);
            TimeSheet.find({'userId': userId, 'active':1}).forEach(function (e){
                var approve = {
                    projectId : id,
                    approved : false,
                    sentBack : false
                };

                Meteor.call('addProjectToApprovalArray', e._id, approve);

            });
            Session.set('editing_addtag', null);


    },

    'dblclick .display .todo-text': function (evt, tmpl) {
        'use strict';
        Session.set('editing_itemname', this._id);
        Deps.flush(); // update DOM before focus
        activateInput(tmpl.find("#todo-input"));
    },

    'click .remove': function (evt) {
        'use strict';
        //evt.target.parentNode.style.opacity = 0;
        // wait for CSS animation to finish
        var userId = String(evt.target.parentNode.parentNode.id);
        Meteor.call('removeEmployeeFromProject', userId, String(this));
        var value = String(this);
            TimeSheet.find({'userId': userId, 'active':1}).forEach(function (e){
                var approveArray = e.projectApprovalArray;
                var i = [];
                for(var a in approveArray){
                    // console.log(approveArray[a].projectId);
                    if(approveArray[a].projectId != value){
                       i.push(approveArray[a]);
                    }
                }

                //Meteor.call('removeProjectFromApprovalArray', e._id, i);
            });
    }
});

var okCancelEvents = function (selector, callbacks) {
    'use strict';
    var ok = callbacks.ok || function () { return; },
        cancel = callbacks.cancel || function () { return; },
        events = {};

    events['keyup ' + selector + ', keydown ' + selector + ', focusout ' + selector] =
        function (evt) {
            if (evt.type === "keydown" && evt.which === 27) {
                // escape = cancel
                cancel.call(this, evt);

            } else if ((evt.type === 'keyup' && evt.which === 13) ||
                    evt.type === 'focusout') {
                // blur/return/enter = ok/submit if non-empty
                var value = String(evt.target.value || "");
                if (value) {
                    ok.call(this, value, evt);
                } else {
                    cancel.call(this, value, evt);
                }
            }
        };

    return events;
};

var activateInput = function (input) {
    'use strict';
    input.focus();
};

Template.associatedProjects.events(okCancelEvents(
    '#edittag-input',
    {
        ok: function (value) {
            Meteor.call('addEmployeeToProject', this._id, value);
            TimeSheet.find({'userId': this._id, 'active':1}).forEach(function (e){
                var approve = {
                    projectId : value,
                    approved : false,
                    sentBack : false
                };

                Meteor.call('addProjectToApprovalArray', e._id, approve);

            });
            Session.set('editing_addtag', null);
        },
        cancel: function (value) {
            Session.set('editing_addtag', null);
        }
    }
));

Template.employeeSettings.helpers({
    addHolidayProjects: function() {
        'use strict';
        var employees = Meteor.users.find({});
        var holiday = ChargeNumbers.findOne({'is_holiday': true});
        if (!holiday) { return; }
        employees.forEach(function (e) {
            if (e.fulltime && e.projects.indexOf(holiday._id) == -1) {
                Meteor.call('addEmployeeToProject', e._id, holiday._id);

                var approve = {
                    projectId : holiday._id,
                    approved : false,
                    sentBack : false
                };

                Meteor.call('addProjectToApprovalArray', e._id, approve);
            }
        });
    },
    chargeNumbers: function () {
        'use strict';
        var toReturn = [];
        ChargeNumbers.find().forEach(function (cn) {
            if (cn.indirect) {
                var dateObj = new Date();
                toReturn.push({
                    id: cn._id,
                    text: 'Indirect   ( ' + cn.name + ' )',
                    end_date : dateObj.getMonth() + '/' + dateObj.getDate() + '/' + dateObj.getFullYear()+1
                });
            } else {
                toReturn.push({
                    id : cn._id,
                    text : cn.id + '   ( ' + cn.name + ' )',
                    end_date : cn.end_date
                });
            }
        });
        return toReturn;
    },
    isActive: function (date) {
        'use strict';
        return ProjectService.isActive(date);
    },
});

Template.employeeSettings.events({
    'click #addAll': function (evt) {
        var ids = [];
        var users = Meteor.users.find().forEach(function(user){
            var userId = user._id;
            ids.push(userId);
        });

        var tempId;
        var projId = $('#edittag-input').find(":selected").attr('value');
        for(tempId in ids){
            Meteor.call('addEmployeeToProject', ids[tempId], projId);
            TimeSheet.find({'userId': ids[tempId], 'active':1}).forEach(function (e){
                var approve = {
                    projectId : projId,
                    approved : false,
                    sentBack : false
                };

                Meteor.call('addProjectToApprovalArray', e._id, approve);

            });
        }
    },
    'click #removeAll': function (evt) {
        var ids = [];
        var users = Meteor.users.find().forEach(function(user){
            var userId = user._id;
            ids.push(userId);
        });

        var tempId;
        var projId = $('#edittag-input').find(":selected").attr('value');
        for(tempId in ids){

            Meteor.call('removeEmployeeFromProject', ids[tempId], projId);
            var value = projId;
                TimeSheet.find({'userId': ids[tempId], 'active':1}).forEach(function (e){
                    var approveArray = e.projectApprovalArray;
                    var i = [];
                    for(var a in approveArray){
                        // console.log(approveArray[a].projectId);
                        if(approveArray[a].projectId != value){
                           i.push(approveArray[a]);
                        }
                    }

                    Meteor.call('removeProjectFromApprovalArray', e._id, i);
                });
        }
    }
});