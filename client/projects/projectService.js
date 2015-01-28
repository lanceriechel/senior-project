ProjectService = {
    isActive: function(date) {
        date = date.split('/');
        var dateObj = new Date(date[2], parseInt(date[0], 10) - 1, parseInt(date[1], 10)+1);
        return dateObj.getTime() >= Date.now();
    },
    ensureValidProject: function(row, chargeNumber, name, startDate, endDate, manager) {
        var valid = true;
        if(chargeNumber === ''){
            ProjectService.addError(row, '#charge_number', 'Missing charge number');
            valid = false;
        }
        if(name === ''){
            ProjectService.addError(row, '#project_name', 'Missing project name');
            valid = false;
        }
        if(startDate === ''){
            ProjectService.addError(row, '#start_date', 'Missing start date');
            valid = false;
        }
        if(endDate === ''){
            ProjectService.addError(row, '#end_date', 'Missing end date');
            valid = false;
        }
        if(manager === ''){
            ProjectService.addError(row, '#manager', 'Missing manager');
            valid = false;
        }
        if(!ProjectService.datesValid(startDate, endDate)){
            ProjectService.addError(row, '#start_date', 'End date must be after start date');
            ProjectService.addError(row, '#end_date', 'End date must be after start date');
            valid = false;
        }
        return valid;
    },
    datesValid: function(startDate, endDate) {
        if(startDate == '' || endDate == ''){
            return true;
        }
        startDate = startDate.split('/');
        endDate = endDate.split('/');
        var startDateObj = new Date(startDate[2], parseInt(startDate[0], 10) - 1, parseInt(startDate[1], 10));
        var endDateObj = new Date(endDate[2], parseInt(endDate[0], 10) - 1, parseInt(endDate[1], 10));

        return endDateObj.getTime() >= startDateObj;
    },
    removeErrorClasses: function(row, selectors) {
        for(var i = 0; i<selectors.length; i++){
            var item = $(row).find(selectors[i]);
            item.parent().removeClass('has-error');
            item.tooltip('destroy');
        }
    },
    addError: function(row, selector, message){
        $(row).find(selector).parent().addClass('has-error');
        $(row).find(selector).tooltip({
            title: message,
            trigger: 'hover',
            animation: false
        });
        $(row).find(selector).tooltip('show');
    },
    getManagers: function(){
	return Meteor.users.find({});
    }
};


