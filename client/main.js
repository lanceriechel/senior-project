ChargeNumbers = new Meteor.Collection('charge_numbers');
Employees = new Meteor.Collection('employees');
TimeSheet = new Meteor.Collection('time_sheets');
Jobs = new Meteor.Collection('jobs');

Deps.autorun(function () {
    Meteor.subscribe('userData');
    Meteor.subscribe('projects');
    Meteor.subscribe('timesheet');
    Meteor.subscribe('serverjobs');
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
    isTimesheet: function () {
        return Session.equals('current_page', 'time_sheet') ||
            Session.equals('current_page', 'selected_timesheet');
    },
    isHistorical: function(){
        Session.set('year', new Date().getFullYear());
        return Session.equals('current_page', 'historical_page');
    },
    isActiveProjects: function(){
        return Session.equals('current_page', 'active_projects');
    },
    isEmployeeSettings: function () {
        return Session.equals('current_page', 'employees_settings');
    },
    isAdminPage: function () {
        return Session.equals('current_page', 'admin_page');
    },
    isSelectedTimesheet: function () {
        return Session.equals('current_page', 'selected_timesheet');
    },
    isHistoricalTimesheet: function () {
        return Session.equals('current_page', 'historical_timesheet');
    },
    isLoginPage: function () {
        return Session.equals('current_page', 'login_page');
    },
    isApproval: function () {
        return Session.equals('current_page', 'approval_page');
    },
    isManager: function () {
        var id = Session.get('LdapId');
        if (!id){
            return;
        }
        var user = Meteor.users.findOne({_id: id});
        if (!user){
            return false;
        }
        return user.manager;
    },
    isAdmin: function () {
        var id = Session.get('LdapId');
        if (!id){
            return;
        }
        var user = Meteor.users.findOne({_id: id});
        if (!user){
            return false;
        }
        return user.admin;
    }

});
Template.mainSelector.helpers({
    isTimesheet: function () {
        return Session.equals('current_page', 'time_sheet');
    },
    isHistorical: function(){
        return Session.equals('current_page', 'historical_page');
    },
    isActiveProjects: function(){
        return Session.equals('current_page', 'active_projects');
    },
    isEmployeeSettings: function () {
        return Session.equals('current_page', 'employees_settings');
    },
    isSelectedTimesheet: function () {
        return Session.equals('current_page', 'selected_timesheet');
    },
    isHistoricalTimesheet: function () {
        return Session.equals('current_page', 'historical_timesheet');
    },
    isApproval: function () {
        return Session.equals('current_page', 'approval_page');
    },
    isLoginPage: function () {
        return Session.equals('current_page', 'login_page');
    },
    isAdminPage: function () {
        return Session.equals('current_page', 'admin_page');
    }
});
Template.loginPage.events({
    'click .btn': function (event) {
        /*
            Gets login information from the page and sends it to LDAP for validation.
            This is not secure and is temporary for testing, eventually need to switch to headers with Apache.
        */
        event.target.type = 'button';
        $('#LDAPusername').parent().removeClass('has-error');
        $('#LDAPpassword').parent().removeClass('has-error');
        $('#LDAPusername').tooltip('destroy');
        $('#LDAPpassword').tooltip('destroy');

        var username = $('#LDAPusername')[0].value;
        var password = $('#LDAPpassword')[0].value;  

        authenticateLdapEmployee(username, password);
    }
});
