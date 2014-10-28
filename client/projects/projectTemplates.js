Template.activeProjects.helpers({
    projects: function(){
        return DatabaseService.getProjects();
    },
    isActive: function(date){
        return ProjectService.isActive(date);
    }
});

Template.projectInfo.events = {
    'blur .charge_number .project_name': function(event){
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
    },
    'click .manager': function(evt){
        var parent = evt.currentTarget.parentNode;
        parent.innerHTML = '<select id="manager_to_change">' + $('#manager_to_add').html() + "</select>";
    }
};

Template.addProject.rendered = function(){
    $('#start_date_to_add').datepicker({});
    $('#end_date_to_add').datepicker({});
    $.each($('[id=start_date]'), function(index, value){
        value.datepicker({});
    });
    $.each($('[id=end_date]'), function(index, value){
        value.datepicker({});
    });
}

Template.addProject.events = {
    'click button': function(){
        var chargeNumber = document.getElementById("charge_number_to_add").value;
        var name = document.getElementById("project_name_to_add").value;
        var startDate = document.getElementById("start_date_to_add").value;
        var endDate = document.getElementById("end_date_to_add").value;
        var manager = document.getElementById("manager_to_add").value;

        var error = document.getElementById("add_charge_number_error");

        if(ProjectService.areValidProjectParams(chargeNumber, name, startDate, endDate, manager)){
            error.hidden = true;
            DatabaseService.addNewProject({
                "id": chargeNumber,
                "name": name,
                "start_date": startDate,
                "end_date": endDate,
                "manager": manager
            });
            // add ui test
            document.getElementById("charge_number_to_add").value = "";
            document.getElementById("project_name_to_add").value = "";
            document.getElementById("start_date_to_add").value = "";
            document.getElementById("end_date_to_add").value = "";
            document.getElementById("manager_to_add").value = "";
        } else {
            // add ui test
            error.hidden = false;
            error.innerHTML =  "";
            if(chargeNumber == ""){
                $( "#add_charge_number_error" ).append("Missing charge number<br>");
            }
            if(name == ""){
                $( "#add_charge_number_error" ).append("Missing project name<br>");
            }
            if(startDate == ""){
                $( "#add_charge_number_error" ).append("Missing start date<br>");
            }
            if(endDate == ""){
                $( "#add_charge_number_error" ).append("Missing end date<br>");
            }
            if(manager == ""){
                $( "#add_charge_number_error" ).append("Missing manager<br>");
            }
        }
    }
};

Template.employeesListDropDown.helpers({
    employees: function() {
        return DatabaseService.getEmployees();
    }
});

Template.archivedProjects.helpers({
    projects: function() {
        return DatabaseService.getProjects();
    },
    isArchived: function(date) {
        return !ProjectService.isActive(date);
    }
});