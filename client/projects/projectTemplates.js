Template.activeProjectEntries.helpers({
    projects: function(){
        return ChargeNumbers.find({"indirect": {$exists: false}});
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
        var indirect = $(row).find('#indirect')[0].checked;

        ProjectService.removeErrorClasses(row, ['#charge_number', '#project_name', '#start_date', '#end_date','#manager']);

        if (indirect) {
            if(ProjectService.ensureValidIndirectProject(row, chargeNumber, name, manager)) {
            DatabaseService.addNewProject({
                'id': chargeNumber,
                'name': name,
                'manager': manager,
                'indirect': true
            });
            $(row).find('#charge_number')[0].value = '';
            $(row).find('#project_name')[0].value = '';
            $(row).find('#start_date')[0].value = '';
            $(row).find('#end_date')[0].value = '';
            $(row).find('#manager')[0].value = '';
        }
        } else {
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
    }
};

Template.employeesListDropDown.helpers({
    employees: function() {
        return DatabaseService.getManagers();
    }
});

Template.archivedProjectsEntries.helpers({
    projects: function() {
        return ChargeNumbers.find({"indirect": {$exists: false}});
    },
    isArchived: function(date) {
        return !ProjectService.isActive(date);
    }
});

Template.activeProjects.helpers({
    getHoliday: function() {
        var projects = DatabaseService.getProjects();
        var holiday = ChargeNumbers.findOne({'is_holiday': true});

        if (!holiday) {
            var d = new Date();
            var startDate = d.getMonth()+1 + "/" + d.getDate() + "/" + d.getFullYear();
            d.setFullYear(d.getFullYear() + 100); 
            var endDate = d.getMonth()+1 + "/" + d.getDate() + "/" + d.getFullYear();

            admin = Meteor.users.findOne({'admin': true});

            ChargeNumbers.insert(
                {
                    id: '1000',
                    name: 'Holiday',
                    start_date: startDate,
                    end_date: endDate,
                    manager: admin.username,
                    is_holiday: true,
                    indirect: true
                });
        }
    }
});

Template.indirectChargeItems.helpers({
    projects: function(){
        return ChargeNumbers.find({"indirect": true});
    }
});