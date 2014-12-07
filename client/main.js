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

Session.setDefault('current_page', 'login_page');

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
    isLoginPage: function(){
        return Session.equals('current_page', 'login_page');
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
    isLoginPage: function(){
        return Session.equals('current_page', 'login_page');
    }
});
Template.loginPage.events({
    'click button': function(event){
        $('#LDAPusername').parent().removeClass('has-error');
        $('#LDAPpassword').parent().removeClass('has-error');
        $('#LDAPusername').tooltip('destroy');
        $('#LDAPpassword').tooltip('destroy');

        var username = $('#LDAPusername')[0].value;
        var password = $('#LDAPpassword')[0].value;  //This is not secure and is temporary for testing, eventually need to switch to headers with Apache.

        authenticateLdapEmployee(username, password);
    }
});
