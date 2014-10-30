Template.associatedProjects.helpers({
    addingTag: function() {
        return Session.equals('editing_addtag', this._id);
    },
    doneClass: function() {
        return this.done ? 'done' : '';
    },
    chargeNumbers: function() {
        return DatabaseService.getProjects();
    },
    isActive: function(date){
        date = date.split('/');
        var dateObj = new Date(date[2], parseInt(date[1]) - 1, date[0]);
        return dateObj.getTime() >= Date.now();
    }
});

Template.associatedProjects.events({
    'click .addtag': function (evt, tmpl) {
        //alert(this.username + " ");
        Session.set('editing_addtag', this._id);
        Deps.flush(); // update DOM before focus
        activateInput(tmpl.find("#edittag-input"));
    },

    'dblclick .display .todo-text': function (evt, tmpl) {
        Session.set('editing_itemname', this._id);
        Deps.flush(); // update DOM before focus
        activateInput(tmpl.find("#todo-input"));
    },

    'click .remove': function (evt, tmpl) {
        //evt.target.parentNode.style.opacity = 0;
        // wait for CSS animation to finish
        var userId = String(evt.target.parentNode.parentNode.id);
        Meteor.users.update({'_id': userId}, {$pull: {'projects': String(this)}});
    }
});

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

Template.associatedProjects.events(okCancelEvents(
    '#edittag-input',
    {
        ok: function (value) {
            Meteor.users.update({_id: this._id}, {$addToSet: {projects: value}});
            Session.set('editing_addtag', null);
        },
        cancel: function () {
            Session.set('editing_addtag', null);
        }
    }));