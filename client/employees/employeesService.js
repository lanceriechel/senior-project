Template.employees_Template.helpers({
    employees: function() {
        return DatabaseService.getEmployees();
    }
});


Template.employees_Template.events({
    'click .full': function (evt) {
        Meteor.users.update({_id: this._id}, {$set: {fulltime: true}});
    },
    'click .part': function (evt) {
        Meteor.users.update({_id: this._id}, {$set: {fulltime: false}});
    }
});