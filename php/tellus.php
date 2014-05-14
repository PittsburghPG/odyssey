<?php
require_once ('constants_test.php'); 
$first = $last = $country = $neighborhood = $contact = $about = ""; //intialize to empty
 if (isset($_POST)) {
    $first = test_input($_POST['first']);
	$last = test_input($_POST['last']);
	$country = test_input($_POST['countryofOrigin']);
	$neighborhood = test_input($_POST['neighborhood']);
	$contact = test_input($_POST['contact']);
	about = test_input($_POST['formStory']);
	
	//echo json_encode($name . ' ' . $countryname . ' ' . $age . ' ' . $occupation);
	
	$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
                if (mysqli_connect_errno()) {
                        printf("Connect failed: %s", mysqli_connect_error());
                        exit;
                }

    $q = "Insert into tellus(`First`, `Last`, `Country`, `Neighborhood`, `Contact`, `About`) values ('" . $first ."', " . $last . ", '" . $country . "', '" . $neighborhood . "', '" . $contact . "', '"  . $about . "')";
    if ($db->query($q)) {
		$response["message"] = "Loaded data.";
		//echo json_encode($response);
		 
	} else {
		$response["message"] = "An error occurred.";
		//echo json_encode($response);
       
	}
   $db->close();
} 
function test_input($data)
	{
	  $data = trim($data);
	  $data = stripslashes($data);
	  $data = htmlspecialchars($data);
	  return $data;
	}
?>