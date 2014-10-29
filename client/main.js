ChargeNumbers = new Meteor.Collection('charge_numbers');
Employees = new Meteor.Collection('employees');

Deps.autorun(function(){
    Meteor.subscribe('userData');
    Meteor.subscribe('projects');
});

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY'
});

Session.setDefault('current_page', 'time_sheet');

ChargeNumbersService = {
    isActive: function(date){
        date = date.split('-');
        var dateObj = new Date(date[0], parseInt(date[1]) - 1, date[2]);
        return dateObj.getTime() >= Date.now();
    }
}

Template.pages.events({
    'mousedown .tag': function (evt) {
        Session.set('current_page', evt.currentTarget.id);
    }
});

Template.mainSelector.helpers({
    isTimesheet: function(){
        return Session.equals('current_page', 'time_sheet');
    },
    isProjectSettings: function(){
        return Session.equals('current_page', 'project_settings');
    },
    isEmployeeSettings: function(){
        return Session.equals('current_page', 'employees_settings');
    }
});

Template.employeeSettings.helpers({
    employees: function() {
        var employees = [];

        Meteor.users.find({})
            .forEach( function(item) {
                employees.push({id: item._id, name: item.username, full: item.fulltime, part: !item.fulltime, projects: item.projects});
            } );

        return employees;
    }
});

Template.employeeSettings.events({
    'click .full': function (evt) {
        Meteor.users.update({_id: this.id}, {$set: {fulltime: true}});
    },
    'click .part': function (evt) {
        Meteor.users.update({_id: this.id}, {$set: {fulltime: false}});
    }
});

Template.associatedProjects.helpers({
    projects: function() {
        var todo_id = this.id;
        return _.map(this.projects || [], function (item) {
            return {id: todo_id, name: item.project, project: item};
        });
    },
    addingTag: function() {
        return Session.equals('editing_addtag', this.id);
    },
    doneClass: function() {
        return this.done ? 'done' : '';
    },
    chargeNumbers: function() {
        return ChargeNumbers.find({});
    },
    // DRY
    isActive: function(date){
        date = date.split('-');
        var dateObj = new Date(date[2], parseInt(date[1]) - 1, date[0]);
        return dateObj.getTime() >= Date.now();
    }
});

Template.associatedProjects.events({
    'click .addtag': function (evt, tmpl) {
        Session.set('editing_addtag', this.id);
        Deps.flush(); // update DOM before focus
        activateInput(tmpl.find("#edittag-input"));
    },

    'dblclick .display .todo-text': function (evt, tmpl) {
        Session.set('editing_itemname', this.id);
        Deps.flush(); // update DOM before focus
        activateInput(tmpl.find("#todo-input"));
    },

    'click .remove': function (evt) {
        var id = this.id;
        var project = this.project;

        //evt.target.parentNode.style.opacity = 0;
        // wait for CSS animation to finish
        Meteor.setTimeout(function () {
            Employees.update({_id: id}, {$pull: {projects: project}});
        }, 300);
    }
});

var okCancelEvents = function (selector, callbacks) {
    var ok = callbacks.ok || function () {};
    var cancel = callbacks.cancel || function () {};

    var events = {};
    events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
        function (evt) {
            if (evt.type === "keydown" && evt.which === 27) {
                // escape = cancel
                cancel.call(this, evt);

            } else if (evt.type === "keyup" && evt.which === 13 ||
                evt.type === "focusout") {
                // blur/return/enter = ok/submit if non-empty
                var value = String(evt.target.value || "");
                if (value)
                    ok.call(this, value, evt);
                else
                    cancel.call(this, evt);
            }
        };

    return events;
};

var activateInput = function (input) {
    input.focus();
};

Template.associatedProjects.events(okCancelEvents(
    '#edittag-input',
    {
        ok: function (value) {
            Employees.update({_id: this.id}, {$addToSet: {projects : {project:value}}});
            Session.set('editing_addtag', null);
        },
        cancel: function () {
            Session.set('editing_addtag', null);
        }
    }));


