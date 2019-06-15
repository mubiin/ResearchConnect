// Clean file path string
$('.custom-file-input').on('change', function() {
    //get the file name
    var fileName = $(this).val().replace('C:\\fakepath\\', " ");
    //replace the "Choose a file" label
    $(this)
        .next('.custom-file-label')
        .html(fileName);
});

// Show "save" button after application status update
$('.change-status').on('change', function() {
	$(this).next(".save-status").show();
});

// Add margin-bottom to containers
$('.container').addClass("mb-4");

// Remove margin-bottom from navbar container
$('#navbar-container').removeClass("mb-4");

// Handle resume upload visual
$('#resumeCheck').on('change', function() {
	if (this.checked) {
		console.log("CHECKED");
		$('#inputGroupFile01').attr('disabled', 'disabled');
	}
	else {
		$('#inputGroupFile01').removeAttr('disabled');
		console.log("UNCHECKED");
	}
});

// Handle cover letter upload visual
$('#coverLetterCheck').on('change', function() {
	if (this.checked) {
		$('#inputGroupFile02').attr('disabled', 'disabled');
	}
	else {
		$('#inputGroupFile02').removeAttr('disabled');
	}
});