//Get the manager groups

Meteor.startup(function() {
 Meteor.call('getLdapManagerGroups', function (error, data) {
   if (!error){
     Session.set('manager_groups', data);
   }
 });
}); 

Template.activeProjectEntries.helpers({
    projects: function(){
        return ChargeNumbers.find({'indirect': false});
    },
    isActive: function(date){
        return ProjectService.isActive(date);
    }
});

Template.projectInfo.events = {
    'blur .charge_number, blur .project_name, change .date, blur .customer': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        var chargeNumber =  $(row).find('#charge_number')[0].value;
        var name = $(row).find('#project_name')[0].value;
        var customer = $(row).find('#customer')[0].value;
        var startDate = $(row).find('#startDate')[0].value;
        var endDate = $(row).find('#endDate')[0].value;
        var manager = $(row).find('#manager')[0].value;

        var project = ChargeNumbers.findOne({'_id': row.id});

        ProjectService.removeErrorClasses(row, ['#charge_number', '#project_name', '#customer', '#startDate', '#endDate','#manager']);

        if(ProjectService.ensureValidProject(row, chargeNumber, name, customer, startDate, endDate, manager)) {
            Meteor.call('updateProject', this._id, {
                'id': chargeNumber,
                'name': name,
                'customer': customer,
                'startDate': startDate,
                'endDate': endDate,
                'is_holiday': project.is_holiday,
                'indirect': project.indirect,
                'manager': manager
            },
            function (){
            $('.toast').addClass('active');
            setTimeout(function () {
                $('.toast').removeClass('active');
            }, 5000);
        });
        }
    },
    'blur .manager-dropdown': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        var chargeNumber = $(row).find('#charge_number')[0].value;
        var name = $(row).find('#project_name')[0].value;
        var customer = $(row).find('#customer')[0].value;
        var startDate = $(row).find('#startDate')[0].value;
        var endDate = $(row).find('#endDate')[0].value;
        var manager = $(row).find('select')[0].value;

        var project = ChargeNumbers.findOne({'_id': row.id});

        if(ProjectService.ensureValidProject(row, chargeNumber, name, customer, startDate, endDate, manager)) {
            Meteor.call('updateProject', this._id, {
                'id': chargeNumber,
                'name': name,
                'customer': customer,
                'startDate': startDate,
                'endDate': endDate,
                'is_holiday': project.is_holiday,
                'indirect': project.indirect,
                'manager': manager
            },
            function (){
            $('.toast').addClass('active');
            setTimeout(function () {
                $('.toast').removeClass('active');
            }, 5000);
        });
        }

        var parent = event.currentTarget.parentNode;
        parent.innerHTML = '<input type="text" class="large-input form-control manager" id="manager" value=' + manager + '>';
    },
    'click .manager': function(evt){
        var parent = evt.currentTarget.parentNode;
        parent.innerHTML = Blaze.toHTML(Blaze.With('', function() { return Template.employeesListDropDown; }));
    },
    'click button': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        var chargeNumber = $(row).find('#charge_number')[0].value;
        var name = $(row).find('#project_name')[0].value;
        var customer = $(row).find('#customer')[0].value;
        var startDate = $(row).find('#startDate')[0].value;
        var endDate = $(row).find('#endDate')[0].value;
        var manager = $(row).find('#manager')[0].value;

        var project = ChargeNumbers.findOne({'_id': row.id});

        Meteor.call('updateProject', this._id, {
                'id': chargeNumber,
                'name': name,
                'customer': customer,
                'startDate': startDate,
                'endDate': endDate,
                'is_holiday': project.is_holiday,
                'indirect': true,
                'manager': manager
        },
            function (){
            $('.toast').addClass('active');
            setTimeout(function () {
                $('.toast').removeClass('active');
            }, 5000);
        });
    }
};

Template.projectInfo.rendered = function(){
    $.each($('[id=startDate]'), function(index, value){
        $(value).datepicker({autoclose: true, todayHighlight: true});
    });
    $.each($('[id=endDate]'), function(index, value){
        $(value).datepicker({autoclose: true, todayHighlight: true});
    });
};

Template.addProject.rendered = function(){
    $('#startDate').datepicker({orientation: 'top auto', autoclose: true, todayHighlight: true});
    $('#endDate').datepicker({orientation: 'top auto', autoclose: true, todayHighlight: true});
};

Template.addProject.events = {
    'click button': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        var chargeNumber = $(row).find('#charge_number')[0].value;
        var name = $(row).find('#project_name')[0].value;
        var startDate = $(row).find('#startDate')[0].value;
        var endDate = $(row).find('#endDate')[0].value;
        var manager = $(row).find('#manager')[0].value;
        var customer = $(row).find('#customer')[0].value;

        ProjectService.removeErrorClasses(row, ['#charge_number', '#project_name', '#startDate', '#endDate','#manager']);

        if (chargeNumber === 'Indirect') {
            if(ProjectService.ensureValidIndirectProject(row, chargeNumber, customer, name, manager)) {
                var projects = ChargeNumbers.find({});
                var projIds = [];
                projects.forEach(function(p) {
                    projIds.push(p.id);
                });
                var chargeNum = Math.floor(Math.random()*9000) + 1000;

                while($.inArray(chargeNum, projIds) !== -1) {
                    chargeNum = Math.floor(Math.random()*9000) + 1000;
                }

                Meteor.call('addNewProject', {
                    'id': chargeNum.toString(),
                    'name': name,
                    'customer': customer,
                    'startDate': startDate,
                    'endDate': endDate,
                    'manager': manager,
                    'indirect': true
            });
            $(row).find('#charge_number')[0].value = '';
            $(row).find('#project_name')[0].value = '';
            $(row).find('#customer')[0].value = '';
            $(row).find('#startDate')[0].value = '';
            $(row).find('#endDate')[0].value = '';
            $(row).find('#manager')[0].value = '';
        }
        } else {
        if(ProjectService.ensureValidProject(row, chargeNumber, name, customer, startDate, endDate, manager)) {
            Meteor.call('addNewProject', {
                'id': chargeNumber,
                'name': name,
                'customer': customer,
                'startDate': startDate,
                'endDate': endDate,
                'manager': manager,
                'indirect': false
            });
            $(row).find('#charge_number')[0].value = '';
            $(row).find('#project_name')[0].value = '';
            $(row).find('#customer')[0].value = '';
            $(row).find('#startDate')[0].value = '';
            $(row).find('#endDate')[0].value = '';
            $(row).find('#manager')[0].value = '';
        }
    }
    },
    'click #indirect': function(event) {
        var row = event.currentTarget.parentNode.parentNode;
        $(row).find('#charge_number')[0].value = 'Indirect';
        $(row).find('#charge_number')[0].disabled = true;
    },
    'click #nonIndirect': function(event) {
        var row = event.currentTarget.parentNode.parentNode;
        $(row).find('#charge_number')[0].value = '';
        $(row).find('#charge_number')[0].disabled = false;
        $(row).find('#startDate')[0].disabled = false;
        $(row).find('#endDate')[0].disabled = false;
    }
};

Template.employeesListDropDown.helpers({
    employees: function() {
        return Meteor.users.find({});
    },
    managers: function() {
        var managerGroups = [];
        Session.get('manager_groups').forEach(function (group){
            managerGroups.push({username: group});
        });
	return managerGroups;
    }
});

Template.archivedProjectsEntries.helpers({
    projects: function() {
        return ChargeNumbers.find();
    },
    isArchived: function(date) {
        return !ProjectService.isActive(date);
    }
});

Template.indirectInfo.rendered = function(){
    $.each($('[id=startDate]'), function(index, value){
        $(value).datepicker({autoclose: true, todayHighlight: true});
    });
    $.each($('[id=endDate]'), function(index, value){
        $(value).datepicker({autoclose: true, todayHighlight: true});
    });
};

Template.indirectChargeItems.events({
    'blur .project_name, blur .customer, change .date': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        var name =  $(row).find('#project_name')[0].value;
        var _id=row.id;
        var customer = $(row).find('#customer')[0].value;
        var startDate = $(row).find('#startDate')[0].value;
        var endDate = $(row).find('#endDate')[0].value;
        var manager = $(row).find('#manager')[0].value;

        var project = ChargeNumbers.findOne({'_id': _id});

            Meteor.call('updateProject', _id, {
                'id': project.id,
                'name': name,
                'customer': customer,
                'startDate': startDate,
                'endDate': endDate,
                'manager': manager,
                'is_holiday': project.is_holiday,
                'indirect': project.indirect
            },
            function (){
            $('.toast').addClass('active');
            setTimeout(function () {
                $('.toast').removeClass('active');
            }, 5000);
        });
        },
    'click .manager': function(evt){
        var parent = evt.currentTarget.parentNode;
        parent.innerHTML = Blaze.toHTML(Blaze.With('', function() { return Template.employeesListDropDown; }));
    },
    'click button': function(event){
        var row = event.currentTarget.parentNode.parentNode;
        var name = $(row).find('#project_name')[0].value;
        var customer = $(row).find('#customer')[0].value;
        var startDate = $(row).find('#startDate')[0].value;
        var endDate = $(row).find('#endDate')[0].value;
        var manager = $(row).find('#manager')[0].value;

        var project = ChargeNumbers.findOne({'_id': row.id});

        Meteor.call('updateProject', this._id, {
                'id': project.id,
                'name': name,
                'customer': customer,
                'startDate': startDate,
                'endDate': endDate,
                'is_holiday': project.is_holiday,
                'indirect': false,
                'manager': manager
        },
            function (){
            $('.toast').addClass('active');
            setTimeout(function () {
                $('.toast').removeClass('active');
            }, 5000);
        });
    }
});

Template.indirectChargeItems.helpers({
    projects: function(){
        return ChargeNumbers.find({'indirect': true});
    },
    isActive: function(date) {
        if (!date){
            return true;
        }
        return ProjectService.isActive(date);
    }
});
