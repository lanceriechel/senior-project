ProjectService = {
    isActive: function(date){
        date = date.split('/');
        var dateObj = new Date(date[2], parseInt(date[0]) - 1, date[1]);
        return dateObj.getTime() >= Date.now();
    }
}