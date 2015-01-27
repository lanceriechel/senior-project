DatabaseService = {
    getProjects: function(){
        return ChargeNumbers.find({});
    },
    addNewProject: function(project){
        ChargeNumbers.insert(project);
    },
    getEmployees: function(){
        return Meteor.users.find({});
    },
    getManagers: function(){
        return Meteor.users.find({ manager: true });
    },
    updateProject: function(id, project){
        ChargeNumbers.update(
            {
                '_id': id
            },
            project
        );
    },
    getUnsubscribedProjects: function(subscribed) {
        return ChargeNumbers.find({ id: {$nin : subscribed }});
    }
}