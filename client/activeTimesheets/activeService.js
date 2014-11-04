ActiveService = {
	isActiveTimesheet: function(date) {
        date = date.split('/');
        var dateObj = new Date(date[2], parseInt(date[0], 10) - 1, parseInt(date[1], 10)+1);
        return dateObj.getTime() >= Date.now();
    },

};