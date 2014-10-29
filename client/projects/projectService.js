ProjectService = {
    isActive: function(date) {
        date = date.split('/');
        var dateObj = new Date(date[2], parseInt(date[0], 10) - 1, parseInt(date[1], 10)+1);
        return dateObj.getTime() >= Date.now();
    },
    areValidProjectParams: function(chargeNumber, name, startDate, endDate, manager) {
        if(chargeNumber === '' || name === '' || startDate === '' || endDate === '' || manager === ''){
            return false;
        }
        return true;
    },
    datesValid: function(startDate, endDate) {
        startDate = startDate.split('/');
        endDate = endDate.split('/');
        var startDateObj = new Date(startDate[2], parseInt(startDate[0], 10) - 1, parseInt(startDate[1], 10));
        var endDateObj = new Date(endDate[2], parseInt(endDate[0], 10) - 1, parseInt(endDate[1], 10));

        return endDateObj.getTime() >= startDateObj;
    },
    removeErrorClasses: function(row, id1, id2, id3, id4, id5) {
        $(row).find(id1).parent().removeClass('has-error');
        $(row).find(id2).parent().removeClass('has-error');
        $(row).find(id3).parent().removeClass('has-error');
        $(row).find(id4).parent().removeClass('has-error');
        $(row).find(id5).parent().removeClass('has-error');
    }
};


