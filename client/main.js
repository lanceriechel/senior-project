ChargeNumbers = new Meteor.Collection('charge_numbers');
Employees = new Meteor.Collection('employees');
TimeSheet = new Meteor.Collection('time_sheets');


Deps.autorun(function(){
    Meteor.subscribe('userData');
    Meteor.subscribe('projects');
    Meteor.subscribe('timesheet');
});

Accounts.ui.config({
    passwordSignupFields: 'USERNAME_ONLY'
});

Session.setDefault('current_page', 'time_sheet');

Template.pages.events({
    'mousedown .tag': function (evt) {
        Session.set('current_page', evt.currentTarget.id);
    }
});

Template.pages.helpers({
    isTimesheet: function(){
        return Session.equals('current_page', 'time_sheet') ||
               Session.equals('current_page', 'selected_timesheet');
    },
    isActiveProjects: function(){
        return Session.equals('current_page', 'active_projects');
    },
    isArchivedProjects: function(){
        return Session.equals('current_page', 'archived_projects');
    },
    isEmployeeSettings: function(){
        return Session.equals('current_page', 'employees_settings');
    },
    isSelectedTimesheet: function(){
        return Session.equals('current_page', 'selected_timesheet');
    }
});
Template.mainSelector.helpers({
    isTimesheet: function(){
        return Session.equals('current_page', 'time_sheet');
    },
    isActiveProjects: function(){
        return Session.equals('current_page', 'active_projects');
    },
    isArchivedProjects: function(){
        return Session.equals('current_page', 'archived_projects');
    },
    isEmployeeSettings: function(){
        return Session.equals('current_page', 'employees_settings');
    },
    isSelectedTimesheet: function(){
        return Session.equals('current_page', 'selected_timesheet');
    }
});


Template.projectHoursFilled.events = {
    'keyup input': function(event){

      var row = event.currentTarget.parentNode.parentNode;
       var comment_t = $(row).find('#Comment')[0].value;
       var sunday_t = $(row).find('#Sunday')[0].value;
       var monday_t = $(row).find('#Monday')[0].value;
       var tuesday_t = $(row).find('#Tuesday')[0].value;
       var wednesday_t = $(row).find('#Wednesday')[0].value;
       var thursday_t = $(row).find('#Thursday')[0].value;
       var friday_t = $(row).find('#Friday')[0].value;
       var saturday_t = $(row).find('#Saturday')[0].value;
       
       var projectName_t = $(row).find('#projectName')[0].value;

     TimeSheetService.removeErrorClasses(row, ['#Comment','#Sunday','#Monday','#Tuesday','#Wednesday','#Thursday','#Friday','#Saturday','#projectName']);
  
     if(TimeSheetService.ensureValidEntry(row, comment_t, sunday_t, monday_t,tuesday_t, wednesday_t, thursday_t, friday_t, saturday_t, projectName_t)){
        }
           /*
           Update Database
           */           

      }
    ,
    'click button': function(event){
       
        /* 
         Remove this row from database
        */

    }
}

Template.projectHours.events = {
    'click button': function(event){
       /*alert("something happened...");*/
       var row = event.currentTarget.parentNode.parentNode;
       var comment_t = $(row).find('#Comment')[0].value;
       var sunday_t = $(row).find('#Sunday')[0].value;
       var monday_t = $(row).find('#Monday')[0].value;
       var tuesday_t = $(row).find('#Tuesday')[0].value;
       var wednesday_t = $(row).find('#Wednesday')[0].value;
       var thursday_t = $(row).find('#Thursday')[0].value;
       var friday_t = $(row).find('#Friday')[0].value;
       var saturday_t = $(row).find('#Saturday')[0].value;
     
     TimeSheetService.removeErrorClasses(row, ['#Comment','#Sunday','#Monday','#Tuesday','#Wednesday','#Thursday','#Friday','#Saturday']);
  
     if(TimeSheetService.ensureValidEntry(row, comment_t, sunday_t, monday_t,tuesday_t, wednesday_t, thursday_t, friday_t, saturday_t)){
            
            /*
            Database Entry
            */

            $(row).find('#Comment')[0].value = '';
            $(row).find('#Sunday')[0].value = '0';
            $(row).find('#Monday')[0].value = '0';
            $(row).find('#Tuesday')[0].value = '0';
            $(row).find('#Wednesday')[0].value = '0';
            $(row).find('#Thursday')[0].value = '0';
            $(row).find('#Friday')[0].value = '0';
            $(row).find('#Saturday')[0].value = '0';
        }
    }
};

TimeSheetService = {
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
    
    ensureValidEntry: function(row, comment_t, sunday_t, monday_t,tuesday_t, wednesday_t, thursday_t, friday_t, saturday_t,projectName_t){
       
       var valid = true;
       if(comment_t === ''){
          TimeSheetService.addError(row, '#Comment', "Description is Required");
          valid = false;
       }

        if(projectName_t === ''){         
          TimeSheetService.addError(row, '#projectName', "Field Cannot be Empty");
          valid = false;
       }
       if(isNaN(sunday_t)){
          TimeSheetService.addError(row, '#Sunday', "Field is Not a Number");
          valid = false;    
       } 
       if(isNaN(monday_t)){
          TimeSheetService.addError(row, '#Monday', "Field is Not a Number");
          valid = false;       
       }
       if(isNaN(tuesday_t)){
          TimeSheetService.addError(row, '#Tuesday', "Field is Not a Number");
          valid = false;
       }
       if(isNaN(wednesday_t)){
          TimeSheetService.addError(row, '#Wednesday', "Field is Not a Number");
          valid = false;
       }
       if(isNaN(thursday_t)){
          TimeSheetService.addError(row, '#Thursday', "Field is Not a Number");
          valid = false;
       }
       if(isNaN(friday_t)){
          TimeSheetService.addError(row, '#Friday', "Field is Not a Number");
          valid = false;
       }
       if(isNaN(saturday_t)){
          TimeSheetService.addError(row, '#Saturday', "Field is Not a Number");
          valid = false;
       }
       if(((sunday_t === '')||(sunday_t === '0')) &&
          ((monday_t === '')||(monday_t === '0')) &&
          ((tuesday_t === '')||(tuesday_t === '0')) &&
          ((wednesday_t === '')||(wednesday_t === '0')) &&
          ((thursday_t === '')||(thursday_t === '0')) &&
          ((friday_t === '')||(friday_t === '0')) &&
          ((saturday_t === '')||(saturday_t === '0')))
       {
          TimeSheetService.addError(row, '#Sunday', "At least one day must have time entered");
          TimeSheetService.addError(row, '#Monday', "");
          TimeSheetService.addError(row, '#Tuesday', "");
          TimeSheetService.addError(row, '#Wednesday', "");
          TimeSheetService.addError(row, '#Thursday', "");
          TimeSheetService.addError(row, '#Friday', "");
          TimeSheetService.addError(row, '#Saturday', "");
          valid = false;
       }
       return valid;
    }
};
