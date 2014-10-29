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
    updateProject: function(id, chargeNumber, name, startDate, endDate, manager){
        ChargeNumbers.update(
            {
                '_id': id
            },
            {
                'id': chargeNumber,
                'name': name,
                'start_date': startDate,
                'end_date': endDate,
                'manager': manager
            }
        );
    }
}