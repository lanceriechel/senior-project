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

        ProjectService.removeErrorClasses(row, '#charge_number', '#project_name', '#start_date', '#end_date','#manager');

        if(ProjectService.areValidProjectParams(chargeNumber, name, startDate, endDate, manager)) {
            ChargeNumbers.update(
                {
                    '_id': this._id
                },
                {
                    'id': chargeNumber,
                    'name': name,
                    'start_date': startDate,
                    'end_date': endDate,
                    'manager': manager
                }
            );
        } else {
            // add ui test
            if(chargeNumber === ''){
                $(row).find('#charge_number').parent().addClass('has-error');
            }
            if(name === ''){
                $(row).find('#project_name').parent().addClass('has-error');
            }
            if(startDate === ''){
                $(row).find('#start_date').parent().addClass('has-error');
            }
            if(endDate === ''){
                $(row).find('#end_date').parent().addClass('has-error');
            }
            if(manager === ''){
                $(row).find('#manager').parent().addClass('has-error');
            }
        }
    },
    'blur .manager-dropdown': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        var manager = $(row).find('select')[0].value;
        ChargeNumbers.update(
            {
                '_id': this._id
            },
            {
                'id' : $(row).find('#charge_number')[0].value,
                'name': $(row).find('#project_name')[0].value,
                'start_date': $(row).find('#start_date')[0].value,
                'end_date': $(row).find('#end_date')[0].value,
                'manager': manager
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
};

Template.addProject.rendered = function(){
    $('#start_date_to_add').datepicker({});
    $('#end_date_to_add').datepicker({});
};

Template.addProject.events = {
    'click button': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        var chargeNumber = document.getElementById('charge_number_to_add').value;
        var name = document.getElementById('project_name_to_add').value;
        var startDate = document.getElementById('start_date_to_add').value;
        var endDate = document.getElementById('end_date_to_add').value;
        var manager = document.getElementById('manager_to_add').value;

        ProjectService.removeErrorClasses(row, '#charge_number_to_add', '#project_name_to_add', '#start_date_to_add', '#end_date_to_add','#manager_to_add');

        if(ProjectService.areValidProjectParams(chargeNumber, name, startDate, endDate, manager)){
            DatabaseService.addNewProject({
                'id': chargeNumber,
                'name': name,
                'start_date': startDate,
                'end_date': endDate,
                'manager': manager
            });
            // add ui test
            document.getElementById('charge_number_to_add').value = '';
            document.getElementById('project_name_to_add').value = '';
            document.getElementById('start_date_to_add').value = '';
            document.getElementById('end_date_to_add').value = '';
            document.getElementById('manager_to_add').value = '';
        } else {
            // add ui test
            if(chargeNumber === ''){
                $( '#charge_number_to_add' ).parent().addClass('has-error');
            }
            if(name === ''){
                $( '#project_name_to_add' ).parent().addClass('has-error');
            }
            if(startDate === ''){
                $( '#start_date_to_add' ).parent().addClass('has-error');
            }
            if(endDate === ''){
                $( '#end_date_to_add' ).parent().addClass('has-error');
            }
            if(manager === ''){
                $( '#manager_to_add' ).parent().addClass('has-error');
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