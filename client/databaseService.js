DatabaseService = {
    getProjects: function(){
        return ChargeNumbers.find({});
    },
    addNewProject: function(project){
        ChargeNumbers.insert(project);
    },
    getEmployees: function(){
        return Meteor.users.find({});
    }
}