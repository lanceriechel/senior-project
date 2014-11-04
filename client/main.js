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

Template.pages.events({
    'mousedown .tag': function (evt) {
        Session.set('current_page', evt.currentTarget.id);
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
    }
});