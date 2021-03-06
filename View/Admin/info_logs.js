/*-------------------------------------------------------------------------
* Name: info_logs.js                                                         *
* Description:  Scripts to handle changes made to the UI on the log info     *
*               page, such as button clicks (Add, Edit, Delete, Back,        *
*               Logout).                                                     *
*               Scripts to pass log data into the Controller or diplay       *
*               data from the Controller (ajax functions).                   *
---------------------------------------------------------------------------*/

/*global $*/
var currentLogID = "";

$('document').ready(function() {

    // Hide log popup when clicked outside of form
    $(document).mouseup(function(e) {
        var container = $(".add-log-popup");

        // If the target of the click isn't the container nor a descendant of the container
        if (!container.is(e.target) && container.has(e.target).length === 0) {
            closeForm();
        }
    });

    // When user clicks Add 
    $('#add-log-button').on('click', function() {
        addLog();
    });

    // When user clicks Save changes
    $('#edit-button').on('click', function() {
        saveChanges();
    });

    // Force click button whenever enter is pressed
    $(document).keypress(function(e) {
        if (e.key === "Enter") {
            enterPressed();
            return false;
        }
    });
    
    // Check if enter was pressed in search input
    $("#search-input").on('keyup', function(e) {
        if (e.keyCode == 13) {
            $("#search-button").click();
        }
    });
});

// Checks which button should be force clicked when enter is pressed
function enterPressed() {
    // Add form is open, add new parent
    if ($('#add-log-button:visible').length > 0) {
        $("#add-log-button").click();
    }
    // Edit form is open, edit parent
    else if ($('#edit-button:visible').length > 0) {
        $("#edit-button").click();
    }
    // Enter was pressed for delete confirmation
    else if ($('#dialog:visible').length > 0) {
        if ($("#yes-button").is(":focus")) {
            $("#yes-button").click();
        }
        else if ($("#no-button").is(":focus")) {
            $("#no-button").click();
        }
    }
}

// When Add New Log is clicked
// Displays the add log form
function addLogForm(type) {
    $('.add-log-popup').show();
    $('.overlay').show();
    $('#edit-button').hide();
    $('#add-log-button').show();
    $("#header").text("Add New Log");
    $("#sign-instructions").text("Create a new time log for a child.");

    // Add all available child options from database to dropdown
    populateChildren(type);
}

// When user clicks the close button in the top right corner of the 'Add Parent' form
function closeForm() {
    $('.add-log-popup').hide();
    $('.overlay').hide();
    clearFields();
}

// Clears all of the fields in popup screen
function clearFields() {
    $('#date-input').val('');
    $('#select-child').children().remove().end().append('<option selected value="select">-- Select Child --</option>');
    $('#sign-in-time').val('');
    $('#sign-in-signature').val('');
    $('#sign-out-time').val('');
    $('#sign-out-signature').val('');
    $('#error-message').hide();
}

// Adds list of children's names to dropdown
function populateChildren(type) {
    $.ajax({
        url: 'info_logs.php',
        type: 'post',
        dataType: "json",
        async: false,
        data: {
            'populateChildren': 1,
            'type': type,
        },
        success: function(children) {
            if (children == "") {
                showError('There are no children saved in the database');
            }
            else {
                $.each(children, function(key, row) {
                    // Retrieve value and text from ajax
                    var html = "<option value=\"" + key + "\" data-childid=\"" + row["Child_ID"] + "\">" + row['First_Name'] + " " + row['Last_Name'] + "</option>";
                    $("#select-child").append(html);
                });
            }
        }
    });
}

// Add a new time log to the database
function addLog() {
    if (validateFields()) {
        var date = $('#date-input').val();
        var childID = $('#select-child').find('option:selected').attr("data-childid");
        var signInTime = $('#sign-in-time').val();
        var signInSign = $('#sign-in-signature').val();
        var signOutTime = $('#sign-out-time').val();
        var signOutSign = $('#sign-out-signature').val();

        $.ajax({
            url: 'info_logs.php',
            type: 'post',
            async: false,
            data: {
                'addLog': 1,
                'date': date,
                'childID': childID,
                'signInTime': signInTime,
                'signInSign': signInSign,
                'signOutTime': signOutTime,
                'signOutSign': signOutSign,
            },
            success: function(response) {
                if (response == "success") {
                    closeForm();
                    $("#log-table").remove();
                    $("#pagination-info").remove();
                    populateTable();
                    successPopup("Successfully added log");
                }
                else {
                    alert("Unable to save log. " + response);
                }
            }
        });
    }
}

// Validate user filled in required fields and dates are valid
function validateFields() {
    var date = $('#date-input').val();
    var name = $('#select-child').val();
    var timeIn = $('#sign-in-time').val();
    var timeOut = $('#sign-out-time').val();
    
    if (date == "") {
        showError('Please select a date.');
        return false;
    }
    else if (name == "select") {
        showError('Please select a child.');
        return false;
    }
    else if (timeIn && timeOut){
        if (timeOut<timeIn){
            showError('Sign in time cannot be later than sign out time.');
            return false;
        } else {
            return true;
        }
    }
    else {
        return true;
    }
}

// When edit button is clicked for a log
// Displays the edit form for user to edit log information
function editForm(logID) {
    currentLogID = logID;

    // Show log form
    addLogForm("edit");
    $('#add-log-button').hide();
    $('#edit-button').show();
    $("#header").text("Edit Log");
    $("#sign-instructions").text("Please make any changes and click Save Changes.");

    // Populate with selected log data
    populateLogData(logID);
}

// Pre-populates data whenever edit button is clicked
function populateLogData(logID) {
    $.ajax({
        url: 'info_logs.php',
        type: 'post',
        async: false,
        data: {
            'populate': 1,
            'logID': logID,
        },
        success: function(response) {
            var result = $.parseJSON(response);
            if (result[0] === "error") {
                alert("There was a problem with the child information.");
            }
            else {
                populateLogInfo(result);
            }
        }
    });
}

// Populate fields with existing values
function populateLogInfo(info) {
    $('#date-input').val(info[1]);
    $('#select-child option[data-childid="' + info[0] + '"]').prop('selected', true);
    $('#sign-in-time').val(info[2]);
    $('#sign-in-signature').val(info[3]);
    $('#sign-out-time').val(info[4]);
    $('#sign-out-signature').val(info[5]);
}

// Save any changes that user made to log information
function saveChanges() {
    if (validateFields()) {
        var date = $('#date-input').val();
        var childID = $('#select-child').find('option:selected').attr("data-childid");
        var signInTime = $('#sign-in-time').val();
        var signInSign = $('#sign-in-signature').val();
        var signOutTime = $('#sign-out-time').val();
        var signOutSign = $('#sign-out-signature').val();

        $.ajax({
            url: 'info_logs.php',
            type: 'post',
            async: false,
            data: {
                'update': 1,
                'logID': currentLogID,
                'date': date,
                'childID': childID,
                'signInTime': signInTime,
                'signInSign': signInSign,
                'signOutTime': signOutTime,
                'signOutSign': signOutSign,
            },
            success: function(response) {
                if (response == "success") {
                    closeForm();
                    $("#log-table").remove();
                    $("#pagination-info").remove();
                    populateTable();
                    successPopup("Successfully edited log");
                }
                else {
                    alert("Unable to save log. " + response);
                }
            }
        });
    }
}

// Allows user to verify deletion
function deleteLogPopup(logID) {
    $("#dialog").dialog({
        minWidth: 400,
        minHeight: 'auto',
        autoOpen: false,
        buttons: {
            "Yes": {
                text: "Yes",
                id: "yes-button",
                click: function() {
                    deleteLog(logID);
                    $("#dialog").dialog("close");
                    $('.overlay').hide();
                }
            },
            "No": {
                text: "No",
                id: "no-button",
                click: function() {
                    $(this).dialog("close");
                    $('.overlay').hide();
                }
            }
        },
        close: function(ev, ui) {
            $('.overlay').hide();
        }
    });

    $("#dialog").dialog("open");
    $('.overlay').show();
}

// Deletes log when user clicks yes
function deleteLog(logID) {
    $.ajax({
        url: 'info_logs.php',
        type: 'post',
        data: {
            'delete': 1,
            'logID': logID,
        },
        success: function(response) {
            if (!(response == "success")) {
                alert(response);
            }
            else {
                $(".ui-dialog-titlebar-close").click();
                $("#log-table").remove();
                $("#pagination-info").remove();
                populateTable();
                successPopup("Successfully removed log");
            }
        }
    });
}

// Adds table on the log page
function populateTable() {
    $.ajax({
        url: 'info_logs.php',
        type: 'post',
        async: false,
        data: {
            'populateTable': 1,
        },
        success: function(response) {
            $('.table-container').html(response);
        },
        error: function(response) {
            alert("ERROR: " + response);
        }
    });
}

// Update table to show results of search value
function search() {
    var value = $("#search-input").val();

    $("#log-table").remove();
    $("#pagination-info").remove();
    saveSearchString(value);
    populateTable();
    $('#search-input').val(value);
}

// Clear the search field and show fresh table
function clearSearch() {
    $("#search-input").val("");
    var value = $("#search-input").val();

    $("#log-table").remove();
    $("#pagination-info").remove();
    saveSearchString(value);
    populateTable();
    $('#search-input').val(value);
}

// Saves the search string in the Controller as a global variable
function saveSearchString(value) {
    $.ajax({
        url: 'info_logs.php',
        type: 'post',
        async: false,
        data: {
            'saveSearch': 1,
            'search_value': value,
        },
        success: function(response) {
            // $('.table-container').html(response);
        },
        error: function(response) {
            alert("ERROR: " + response);
        }
    });
}

// Shows an error on the form
function showError(message) {
    $('#error-message').show();
    $('#error-message').removeClass("success");
    $('#error-message').addClass("error");
    $('#error-message').text(message);
}

// Shows success message on the form
function showSuccess(message) {
    $('#error-message').show();
    $('#error-message').removeClass("error");
    $('#error-message').addClass("success");
    $('#error-message').text(message);
}

// Shows a success popup after adding/editing/deleting
function successPopup(message) {
    $("#success").text(message);
    $("#success").show().delay(3000).hide(1);
}
