Template.associatedProjects.helpers({
    addingTag: function () {
        'use strict';
        return Session.equals('editing_addtag', this._id);
    },
    doneClass: function () {
        'use strict';
        return this.done ? 'done' : '';
    },
    chargeNumbers: function () {
        'use strict';
        var toReturn = [];
        ChargeNumbers.find({ id: {$nin : this.projects }}).forEach(function (cn) {
            if (cn.indirect) {
                var dateObj = new Date();
                toReturn.push({
                    id: cn.id,
                    text: 'Indirect   ( ' + cn.name + ' )',
                    end_date : dateObj.getMonth() + '/' + dateObj.getDate() + '/' + dateObj.getFullYear()+1
                });
            } else {
                toReturn.push({
                    id : cn.id,
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
    getName: function (id) {
        'use strict';
        var proj = ChargeNumbers.findOne({'id':id});
        return proj.name;
    }
});

Template.employees_Template.events({
    'click .full': function () {
        'use strict';
        Meteor.users.update({_id: this._id}, {$set: {fulltime: true}});
    },
    'click .part': function () {
        Meteor.users.update({_id: this._id}, {$set: {fulltime: false}});
    }
});

Template.associatedProjects.events({
    'click .addtag': function (evt, tmpl) {
        'use strict';
        //alert(this.username + " ");
        Session.set('editing_addtag', this._id);
        Deps.flush(); // update DOM before focus
        activateInput(tmpl.find("#edittag-input"));
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
        Meteor.users.update({'_id': userId}, {$pull: {'projects': String(this)}});
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

                TimeSheet.update({'_id':e._id},
                {
                    $set:{
                        'projectApprovalArray' : i
                     }
                 });
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
            Meteor.users.update({_id: this._id}, {$addToSet: {projects: value}});
            TimeSheet.find({'userId': this._id, 'active':1}).forEach(function (e){
                var approveArray = e.projectApprovalArray;
                approveArray.push({
                    projectId : value,
                    approved : false,
                    sentBack : false
                });

                TimeSheet.update({'_id':e._id},
                {
                    $set:{
                        'projectApprovalArray' : approveArray
                }

                });

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
            if (e.fulltime) {
                if (e.projects.indexOf(holiday.id) == -1) {
                    e.projects.push(holiday.id);
                    Meteor.users.update(
                        {'_id': e._id},
                        {$set: {
                            'projects': e.projects
                        }});
                }
            }
        });
    }
});