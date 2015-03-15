Template.employees_Template.helpers({
    employees: function () {
        "use strict";
        return Meteor.users.find({});
    }
});