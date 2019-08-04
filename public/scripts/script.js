// Prevent dropdown from closing upon click
$('.dropdown-menu').click(function(e) {
    e.stopPropagation();
});

// Clean file path string
$('.custom-file-input').on('change', function() {
    //get the file name
    var fileName = $(this).val().replace('C:\\fakepath\\', " ");
    //replace the "Choose a file" label
    $(this)
        .next('.custom-file-label')
        .html(fileName);
});

// Show input to specify "other" major
$('#selectMajor').on('change', function() {
	if ($(this).val() === 'Other') {
		$('#specifyMajor').show();
		$('#specifyMajor').prop('required', true);
	} else {
		$('#specifyMajor').hide();
		$('#specifyMajor').prop('required', false);
	}
});

// Show "save" button after application status update
$('.change-status').on('change', function() {
	$(this).next(".save-status").show();
});

// Add margin-bottom to containers
$('.container').addClass("mb-4");

// Remove margin-bottom for select containers
$('#navbar-container').removeClass("mb-4");
$('#verifyNotice').removeClass("mb-4");

// Handle resume upload visual
$('.resumeCheck').on('change', function() {
	if (this.checked) {
		$('#inputGroupFile01').attr('disabled', 'disabled');
	}
	else {
		$('#inputGroupFile01').removeAttr('disabled');
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

// // Make navbar responsive to scrolling up/down
// $(function () {
//   var lastScrollTop = 0;
//   var $navbar = $('.navbar');

//   $(window).scroll(function(event){
//     var st = $(this).scrollTop();

//     if (st > lastScrollTop) { // scroll down
//       $navbar.hide();
//     } else { // scroll up
//       $navbar.show();
//     }
//     lastScrollTop = st;
//   });
// });

// Show add posting text when + icon is hovered
$('#addIcon').hover(function() {
	$('#addJob').fadeIn("medium", function(){});
}, function() {
	$('#addJob').fadeOut("fast", function(){});
});

// Show next resume upload field upon "add new resume" button click
for (let i = 0; i < 3; i++) {
	$('.addResume' + i).on('click', function() {
		$('.resumeForm' + (i+1)).show();
		$(this).hide();
	});
}



