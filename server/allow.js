Meteor.users.allow({
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