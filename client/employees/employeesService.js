Template.employees_Template.helpers({
    employees: function() {
        return DatabaseService.getEmployees();
    }
});