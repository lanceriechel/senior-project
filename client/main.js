ChargeNumbers = new Meteor.Collection('charge_numbers');
Employees = new Meteor.Collection('employees');

Deps.autorun(function(){
    Meteor.subscribe('userData');
    Meteor.subscribe('projects');
});

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY'
});

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
};

Template.archived_list.charge_numbers = function() {
    return ChargeNumbers.find({});
};

Template.charge_number_item.charge_numbers = function() {
    return ChargeNumbers.find({});
};

Template.charge_number_item.active = function(date) {
    date = date.split('-');
    var dateObj = new Date(date[0], parseInt(date[1]) - 1, date[2]);
    return dateObj.getTime() >= Date.now();
};

Template.archived_list.archived = function(date){
    date = date.split('-');
    var dateObj = new Date(date[0], parseInt(date[1]) - 1, date[2]);
    return dateObj.getTime() < Date.now();
};

Template.employees_list.employees = function(){
    return Employees.find({});
};

Template.employees_settings.employees = function(){
    var employees = [];

    Meteor.users.find({})
        .forEach( function(item) {
            employees.push({id: item._id, name: item.username, full: item.fulltime, part: !item.fulltime, projects: item.projects});
        } );

    return employees;
};

Template.pages.events({
    'mousedown .tag': function (evt) {
        Session.set('current_page', evt.currentTarget.id);
    }
});

Template.main_selector.isAdminSettings = function() {
    return Session.equals('current_page', 'admin_settings');
};

Template.main_selector.isTimesheet = function() {
    return Session.equals('current_page', 'time_sheet');
};

Template.main_selector.isEmployees = function() {
    return Session.equals('current_page', 'employees_settings');
}

Template.employees_settings.events({
    'click .full': function (evt) {
        Meteor.users.update({_id: this.id}, {$set: {fulltime: true}});
    },
    'click .part': function (evt) {
        Meteor.users.update({_id: this.id}, {$set: {fulltime: false}});
    }
});

//////////////////charge_number_associations//////////////////////////////////
var okCancelEvents = function (selector, callbacks) {
    var ok = callbacks.ok || function () {};
    var cancel = callbacks.cancel || function () {};

    var events = {};
    events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
        function (evt) {
            if (evt.type === "keydown" && evt.which === 27) {
                // escape = cancel
                cancel.call(this, evt);

            } else if (evt.type === "keyup" && evt.which === 13 ||
                evt.type === "focusout") {
                // blur/return/enter = ok/submit if non-empty
                var value = String(evt.target.value || "");
                if (value)
                    ok.call(this, value, evt);
                else
                    cancel.call(this, evt);
            }
        };

    return events;
};

var activateInput = function (input) {
    input.focus();
};

Template.charge_number_associations.any_list_selected = function () {
    return !Session.equals('list_id', null);
};

Template.charge_number_associations.todos = function () {
    // Determine which todos to display in main pane,
    // selected based on list_id and tag_filter.

    var list_id = Session.get('list_id');
    if (!list_id)
        return [];

    var sel = {list_id: list_id};
    var tag_filter = Session.get('tag_filter');
    if (tag_filter)
        sel.tags = tag_filter;

    return ChargeNumbers.find(sel, {sort: {timestamp: 1}});
};

Template.charge_number_item.projects = function () {
    var todo_id = this.id;
    return _.map(this.projects || [], function (item) {
        return {id: todo_id, name: item.project, project: item};
    });
};

Template.charge_number_item.done_class = function () {
    return this.done ? 'done' : '';
};

Template.charge_number_item.editing = function () {
    return Session.equals('editing_itemname', this.id);
};

Template.charge_number_item.adding_tag = function () {
    return Session.equals('editing_addtag', this.id);
};

Template.charge_number_item.events({

    'click .addtag': function (evt, tmpl) {
        Session.set('editing_addtag', this.id);
        Deps.flush(); // update DOM before focus
        activateInput(tmpl.find("#edittag-input"));
    },

    'dblclick .display .todo-text': function (evt, tmpl) {
        Session.set('editing_itemname', this.id);
        Deps.flush(); // update DOM before focus
        activateInput(tmpl.find("#todo-input"));
    },

    'click .remove': function (evt) {
        var id = this.id;
        var project = this.project;

        //evt.target.parentNode.style.opacity = 0;
        // wait for CSS animation to finish
        Meteor.setTimeout(function () {
            Employees.update({_id: id}, {$pull: {projects: project}});
        }, 300);
    }
});

Template.charge_number_item.events(okCancelEvents(
    '#edittag-input',
    {
        ok: function (value) {
            Employees.update({_id: this.id}, {$addToSet: {projects : {project:value}}});
            Session.set('editing_addtag', null);
        },
        cancel: function () {
            Session.set('editing_addtag', null);
        }
    }));
