ChargeNumbers = new Meteor.Collection('charge_numbers');
Employees = new Meteor.Collection('employees');

if (Meteor.isClient) {
    Session.setDefault('current_page', 'time_sheet');

    Template.charge_number_list.charge_numbers = function() {
        return ChargeNumbers.find({});
    };

    Template.add_charge_number.events = {
        'click button': function(){
            ChargeNumbers.insert({
                "id": document.getElementById("charge_number_to_add").value,
                "name": document.getElementById("project_name_to_add").value,
                "start_date": document.getElementById("start_date_to_add").value,
                "end_date": document.getElementById("end_date_to_add").value,
                "manager": document.getElementById("manager_to_add").value
            });
            document.getElementById("charge_number_to_add").value = "";
            document.getElementById("project_name_to_add").value = "";
            document.getElementById("start_date_to_add").value = "";
            document.getElementById("end_date_to_add").value = "";
            document.getElementById("manager_to_add").value = "";

        }
    };

    Template.charge_number_info.events = {
        'blur': function(event){
            var row = event.currentTarget.parentNode.parentNode;
            ChargeNumbers.update(
                {
                    "_id": this._id
                },
                {
                    "id" : row.children[0].children[0].value,
                    "name": row.children[1].children[0].value,
                    "start_date": row.children[2].children[0].value,
                    "end_date": row.children[3].children[0].value,
                    "manager": row.children[4].children[0].value
                }
            )
        }
    };

    Template.charge_number_list.active = function(date) {
        date = date.split('-');
        var dateObj = new Date(date[0], parseInt(date[1]) - 1, date[2]);
        return dateObj.getTime() >= Date.now();
    }


    Template.archived_list.charge_numbers = function() {
        return ChargeNumbers.find({});
    };

    Template.archived_list.archived = function(date){
        date = date.split('-');
        var dateObj = new Date(date[0], parseInt(date[1]) - 1, date[2]);
        return dateObj.getTime() < Date.now();
    }

    Template.employees_list.employees = function(){
        return Employees.find({});
    }

    Template.pages.events({
        'mousedown .tag': function (evt) {
            Session.set('current_page', evt.currentTarget.id);
        }
    });

    Template.main_selector.isAdminSettings = function() {
        return Session.equals('current_page', 'admin_settings');
    }

    Template.main_selector.isTimesheet = function() {
        return Session.equals('current_page', 'time_sheet');
    }
}


