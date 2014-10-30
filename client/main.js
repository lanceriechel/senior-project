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