DatabaseService = {
    getProjects: function(){
        return ChargeNumbers.find({});
    },
    getEmployees: function(){
        return Meteor.users.find({});
    }
}