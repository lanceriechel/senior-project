Template.activeProjectEntries.helpers({
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

        ProjectService.removeErrorClasses(row, ['#charge_number', '#project_name', '#start_date', '#end_date','#manager']);

        if(ProjectService.ensureValidProject(row, chargeNumber, name, startDate, endDate, manager)) {
            DatabaseService.updateProject(this._id, {
                'id': chargeNumber,
                'name': name,
                'start_date': startDate,
                'end_date': endDate,
                'manager': manager
            });
        }
    },
    'blur .manager-dropdown': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        var chargeNumber = $(row).find('#charge_number')[0].value;
        var name = $(row).find('#project_name')[0].value;
        var startDate = $(row).find('#start_date')[0].value;
        var endDate = $(row).find('#end_date')[0].value;
        var manager = $(row).find('select')[0].value;

        if(ProjectService.ensureValidProject(row, chargeNumber, name, startDate, endDate, manager)) {
            DatabaseService.updateProject(this._id, {
                'id': chargeNumber,
                'name': name,
                'start_date': startDate,
                'end_date': endDate,
                'manager': manager
            });
        }

        var parent = event.currentTarget.parentNode;
        parent.innerHTML = '<input type="text" class="large-input form-control manager" id="manager" value=' + manager + '>';
    },
    'click .manager': function(evt){
        var parent = evt.currentTarget.parentNode;
        parent.innerHTML = Blaze.toHTML(Blaze.With("", function() { return Template.employeesListDropDown; }));
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
    $('#start_date').datepicker({});
    $('#end_date').datepicker({});
};

Template.addProject.events = {
    'click button': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        var chargeNumber = $(row).find('#charge_number')[0].value;
        var name = $(row).find('#project_name')[0].value;
        var startDate = $(row).find('#start_date')[0].value;
        var endDate = $(row).find('#end_date')[0].value;
        var manager = $(row).find('#manager')[0].value;

        ProjectService.removeErrorClasses(row, ['#charge_number', '#project_name', '#start_date', '#end_date','#manager']);

        if(ProjectService.ensureValidProject(row, chargeNumber, name, startDate, endDate, manager)) {
            DatabaseService.addNewProject({
                'id': chargeNumber,
                'name': name,
                'start_date': startDate,
                'end_date': endDate,
                'manager': manager
            });
            $(row).find('#charge_number')[0].value = '';
            $(row).find('#project_name')[0].value = '';
            $(row).find('#start_date')[0].value = '';
            $(row).find('#end_date')[0].value = '';
            $(row).find('#manager')[0].value = '';
        }
    }
};

Template.employeesListDropDown.helpers({
    employees: function() {
        return DatabaseService.getEmployees();
    },
    managers: function() {
	return DatabaseService.getManagers();
    }
});

Template.archivedProjectsEntries.helpers({
    projects: function() {
        return DatabaseService.getProjects();
    },
    isArchived: function(date) {
        return !ProjectService.isActive(date);
    }
});
