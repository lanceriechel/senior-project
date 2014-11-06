Template.employees_Template.helpers({
    employees: function () {
        "use strict";
        return DatabaseService.getEmployees();
    }
});