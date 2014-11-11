ChargeNumbers = new Meteor.Collection('charge_numbers');
TimeSheet = new Meteor.Collection('time_sheets');

Meteor.publish('userData', function() {
    return Meteor.users.find({}, {fields: {
        username: 1,
        fulltime: 1,
        admin: 1,
        manager: 1,
        projects: 1
    }});
});

Meteor.publish('projects', function() {
    return ChargeNumbers.find();
});

Meteor.publish('timesheet', function() {
    return TimeSheet.find();
});

TimeSheet.allow({
    insert: function(userId, user){
        return true;
    },
    update: function (userId, users, fields, modifier) {
        return true;
    },
    remove: function(userId, users){
        return false;
    }
});