ChargeNumbers = new Meteor.Collection('charge_numbers');

Accounts.onCreateUser(function (options, user) {
    user.manager = false;
    user.admin = false;
    user.projects = [];
    user.fulltime = true;
    if (options.profile)
        user.profile = options.profile;
    return user;
});

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

Meteor.users.allow({
    insert: function(userId, user){
        return false;
    },
    update: function (userId, users, fields, modifier) {
        return true;
    },
    remove: function(userId, users){
        return false;
    }
});