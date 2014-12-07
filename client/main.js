ChargeNumbers = new Meteor.Collection('charge_numbers');
Employees = new Meteor.Collection('employees');
TimeSheet = new Meteor.Collection('time_sheets');


Deps.autorun(function(){
    Meteor.subscribe('userData');
    Meteor.subscribe('projects');
    Meteor.subscribe('timesheet');
});

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY'
});

Session.setDefault('current_page', 'time_sheet');

Template.pages.events({
    'mousedown .tag': function (evt) {
        Session.set('current_page', evt.currentTarget.id);
    }
});

Template.pages.helpers({
    isTimesheet: function(){
        return Session.equals('current_page', 'time_sheet') ||
               Session.equals('current_page', 'selected_timesheet');
    },
    isActiveProjects: function(){
        return Session.equals('current_page', 'active_projects');
    },
    isArchivedProjects: function(){
        return Session.equals('current_page', 'archived_projects');
    },
    isEmployeeSettings: function(){
        return Session.equals('current_page', 'employees_settings');
    },
    isSelectedTimesheet: function(){
        return Session.equals('current_page', 'selected_timesheet');
    },
    isApproval: function(){
        return Session.equals('current_page', 'approval_page');
    }

});
Template.mainSelector.helpers({
    isTimesheet: function(){
        return Session.equals('current_page', 'time_sheet');
    },
    isActiveProjects: function(){
        return Session.equals('current_page', 'active_projects');
    },
    isArchivedProjects: function(){
        return Session.equals('current_page', 'archived_projects');
    },
    isEmployeeSettings: function(){
        return Session.equals('current_page', 'employees_settings');
    },
    isSelectedTimesheet: function(){
        return Session.equals('current_page', 'selected_timesheet');
    },
    isApproval: function(){
        return Session.equals('current_page', 'approval_page');
    }
});
