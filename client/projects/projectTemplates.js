Template.activeProjects.helpers({
    projects: function(){
        return DatabaseService.getProjects();
    },
    isActive: function(date){
        return ProjectService.isActive(date);
    }
});

Template.projectInfo.events = {
    'blur .charge_number, blur .project_name, blur .date': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        var chargeNumber =  $(row).find('#charge_number')[0].value;
        var name = $(row).find('#project_name')[0].value;
        var startDate = $(row).find('#start_date')[0].value;
        var endDate = $(row).find('#end_date')[0].value;
        var manager = $(row).find('#manager')[0].value;
        ChargeNumbers.update(
            {
                "_id": this._id
            },
            {
                "id" : chargeNumber,
                "name": name,
                "start_date": startDate,
                "end_date": endDate,
                "manager": manager
            }
        );
    },
    'blur .manager-dropdown': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        var manager = $(row).find('select')[0].value;
        ChargeNumbers.update(
            {
                "_id": this._id
            },
            {
                "id" : $(row).find('#charge_number')[0].value,
                "name": $(row).find('#project_name')[0].value,
                "start_date": $(row).find('#start_date')[0].value,
                "end_date": $(row).find('#end_date')[0].value,
                "manager": manager
            }
        );
        var parent = event.currentTarget.parentNode;
        parent.innerHTML = '<input type="text" class="manager" id="manager" value=' + manager + '>';
    },
    'click .manager': function(evt){
        var parent = evt.currentTarget.parentNode;
        parent.innerHTML = '<select class="manager-dropdown" id="manager_to_change">' + $('#manager_to_add').html() + "</select>";
    }
};

Template.projectInfo.rendered = function(){
    $.each($('[id=start_date]'), function(index, value){
        $(value).datepicker({});
    });
    $.each($('[id=end_date]'), function(index, value){
        $(value).datepicker({});
    });
}

Template.addProject.rendered = function(){
    $('#start_date_to_add').datepicker({});
    $('#end_date_to_add').datepicker({});
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