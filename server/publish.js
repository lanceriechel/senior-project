ChargeNumbers = new Meteor.Collection('charge_numbers');

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