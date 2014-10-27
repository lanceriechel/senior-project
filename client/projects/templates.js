Template.activeProjects.helpers({
    projects: function(){
        return ChargeNumbers.find({});
    },
    isActive: function(date){
        return ProjectService.isActive(date);
    }
});

Template.projectInfo.events = {
    'blur': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        ChargeNumbers.update(
            {
                "_id": this._id
            },
            {
                "id" : row.children[0].children[0].value,
                "name": row.children[1].children[0].value,
                "start_date": row.children[2].children[0].value,
                "end_date": row.children[3].children[0].value,
                "manager": row.children[4].children[0].value
            }
        )
    }
};

Template.addProject.rendered = function(){
    $('#start_date_to_add').datepicker({});
    $('#end_date_to_add').datepicker({});
}

Template.addProject.events = {
    'click button': function(){
        var val1 = document.getElementById("charge_number_to_add").value;
        var val2 = document.getElementById("project_name_to_add").value;
        var val3 = document.getElementById("start_date_to_add").value;
        var val4 = document.getElementById("end_date_to_add").value;
        var val5 = document.getElementById("manager_to_add").value;

        if(val1 == "" || val2 == "" || val3 == "" || val4 == "" || val5==""){
            document.getElementById("error").innerHTML = "One or more fields is empty.";
        }else{

            ChargeNumbers.insert({
                "id": document.getElementById("charge_number_to_add").value,
                "name": document.getElementById("project_name_to_add").value,
                "start_date": document.getElementById("start_date_to_add").value,
                "end_date": document.getElementById("end_date_to_add").value,
                "manager": document.getElementById("manager_to_add").value
            });
            document.getElementById("charge_number_to_add").value = "";
            document.getElementById("project_name_to_add").value = "";
            document.getElementById("start_date_to_add").value = "";
            document.getElementById("end_date_to_add").value = "";
            document.getElementById("manager_to_add").value = "";

        }
    }
};

Template.employeesListDropDown.helpers({
    employees: function() {
        return Meteor.users.find({});
    }
});

Template.archivedProjects.helpers({
    projects: function() {
        return ChargeNumbers.find({});
    },
    isArchived: function(date) {
        return !ProjectService.isActive(date);
    }
});