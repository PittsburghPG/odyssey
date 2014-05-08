<?php
require_once ('constants_test.php'); 
$first = $last = $country = $age = $occupation = $email = $phone = $about = ""; //intialize to empty
 if (isset($_POST)) {
    $name = test_input($_POST['tellName']);
	$country = test_input($_POST['tellCountry']);
	if ($country == "") {
		$countryname = " ";
	} else {
		$countryParts = explode("_", $country); //the second part will be the name of the country
		$countryname = $countryParts[1];
	}
	$age = test_input($_POST['tellAge']);
	$occupation = test_input($_POST['tellOccupation']);
	$email = test_input($_POST['tellEmail']);
	$phone = test_input($_POST['tellPhone']);
	$about = test_input($_POST['tellAbout']);
	//echo json_encode($name . ' ' . $countryname . ' ' . $age . ' ' . $occupation);
	
	
	
    $db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
                if (mysqli_connect_errno()) {
                        printf("Connect failed: %s", mysqli_connect_error());
                        exit;
                }

    $q = "Insert into tellus(`Name`, `Age`, `Country`, `Occupation`, `Phone`, `Email`, `About`) values ('" . $name ."', " . $age . ", '" . $countryname . "', '" . $occupation . "', '" . $phone . "', '" . $email . "', '" . $about . "')";
    if ($db->query($q)) {
		$response["message"] = "Loaded data.";
		//echo json_encode($response);
		 $db->close();
	} else {
		$response["message"] = "An error occurred.";
		//echo json_encode($response);
        $db->close();
	}
   
} 
function test_input($data)
	{
	  $data = trim($data);
	  $data = stripslashes($data);
	  $data = htmlspecialchars($data);
	  return $data;
	}
?>